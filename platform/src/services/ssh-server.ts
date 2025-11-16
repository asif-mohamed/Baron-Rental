import { Server as SSHServer2, Connection, ServerChannel } from 'ssh2';
import * as fs from 'fs';
import * as path from 'path';
import { logger } from './logger';

interface SSHServerConfig {
  port: number;
  host: string;
  adminUsername: string;
  adminPassword: string;
  rootPath: string;
  readOnly: boolean;
}

/**
 * SSH Server for Platform Access
 * Provides read-only SSH shell access to the platform file system
 * Allows admin to navigate and read platform code, configs, and docs
 */
export class SSHServer {
  private server: SSHServer2;
  private config: SSHServerConfig;

  constructor(config: SSHServerConfig) {
    this.config = config;
    this.server = new SSHServer2(
      {
        hostKeys: [this.generateHostKey()],
      },
      this.handleClient.bind(this)
    );
  }

  /**
   * Generate or load SSH host key
   */
  private generateHostKey(): string {
    // In production, load from file or environment
    // For development, use a simple key
    const keyPath = path.join(this.config.rootPath, 'config', 'ssh_host_key');
    
    if (fs.existsSync(keyPath)) {
      return fs.readFileSync(keyPath, 'utf8');
    }
    
    // Generate a temporary RSA key for development
    // In production, use proper key generation: ssh-keygen -t rsa -b 4096
    const tempKey = `-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA0Z6FgKEeq8P9NjNxN7yYw7gn0qPUHmH9NuJhMKqVLw7dXqz8
-----END RSA PRIVATE KEY-----`;
    
    return tempKey;
  }

  /**
   * Handle incoming SSH client connection
   */
  private handleClient(client: Connection) {
    logger.info('SSH: Client connected');
    
    client
      .on('authentication', (ctx) => {
        if (
          ctx.method === 'password' &&
          ctx.username === this.config.adminUsername &&
          ctx.password === this.config.adminPassword
        ) {
          logger.info(`SSH: Authentication successful for user: ${ctx.username}`);
          ctx.accept();
        } else {
          logger.warn(`SSH: Authentication failed for user: ${ctx.username}`);
          ctx.reject();
        }
      })
      .on('ready', () => {
        logger.info('SSH: Client authenticated and ready');
        
        client.on('session', (accept, reject) => {
          const session = accept();
          
          session.on('shell', (accept, reject) => {
            logger.info('SSH: Shell requested');
            const stream = accept();
            
            this.handleShell(stream);
          });
          
          session.on('exec', (accept, reject, info) => {
            logger.info(`SSH: Exec requested: ${info.command}`);
            const stream = accept();
            
            this.handleExec(stream, info.command);
          });
        });
      })
      .on('error', (err) => {
        logger.error('SSH: Client error', { error: err });
      })
      .on('end', () => {
        logger.info('SSH: Client disconnected');
      });
  }

  /**
   * Handle interactive shell session
   */
  private handleShell(stream: ServerChannel) {
    let currentPath = this.config.rootPath;
    
    // Send welcome message
    stream.write('='.repeat(80) + '\r\n');
    stream.write('  Baron Platform - Read-Only Shell Access\r\n');
    stream.write('='.repeat(80) + '\r\n');
    stream.write(`Root: ${this.config.rootPath}\r\n`);
    stream.write('Commands: ls, cd, cat, pwd, tree, exit\r\n');
    stream.write('Note: Read-only access - no write operations allowed\r\n');
    stream.write('='.repeat(80) + '\r\n\r\n');
    
    stream.write(`baron-platform:${this.getRelativePath(currentPath)}$ `);
    
    let buffer = '';
    
    stream.on('data', (data: Buffer) => {
      const input = data.toString();
      
      // Handle special characters
      if (input === '\r' || input === '\n') {
        stream.write('\r\n');
        
        const command = buffer.trim();
        buffer = '';
        
        if (command) {
          const result = this.executeCommand(command, currentPath);
          
          if (result.newPath) {
            currentPath = result.newPath;
          }
          
          if (result.output) {
            stream.write(result.output + '\r\n');
          }
          
          if (result.exit) {
            stream.end();
            return;
          }
        }
        
        stream.write(`baron-platform:${this.getRelativePath(currentPath)}$ `);
      } else if (input === '\x7f' || input === '\b') {
        // Backspace
        if (buffer.length > 0) {
          buffer = buffer.slice(0, -1);
          stream.write('\b \b');
        }
      } else if (input === '\x03') {
        // Ctrl+C
        stream.write('^C\r\n');
        buffer = '';
        stream.write(`baron-platform:${this.getRelativePath(currentPath)}$ `);
      } else {
        buffer += input;
        stream.write(input);
      }
    });
    
    stream.on('close', () => {
      logger.info('SSH: Shell session closed');
    });
  }

  /**
   * Handle exec command (non-interactive)
   */
  private handleExec(stream: ServerChannel, command: string) {
    const result = this.executeCommand(command, this.config.rootPath);
    
    if (result.output) {
      stream.write(result.output);
    }
    
    stream.exit(result.exitCode || 0);
    stream.end();
  }

  /**
   * Execute a shell command
   */
  private executeCommand(
    command: string,
    currentPath: string
  ): { output?: string; newPath?: string; exit?: boolean; exitCode?: number } {
    const parts = command.split(' ').filter((p) => p);
    const cmd = parts[0];
    const args = parts.slice(1);
    
    try {
      switch (cmd) {
        case 'ls':
          return { output: this.listFiles(currentPath, args) };
        
        case 'cd':
          return this.changeDirectory(currentPath, args[0]);
        
        case 'cat':
          return { output: this.readFile(currentPath, args[0]) };
        
        case 'pwd':
          return { output: this.getRelativePath(currentPath) };
        
        case 'tree':
          return { output: this.showTree(currentPath, args[0] || '') };
        
        case 'exit':
          return { output: 'Goodbye!', exit: true };
        
        case 'help':
          return { output: this.showHelp() };
        
        default:
          return { output: `Command not found: ${cmd}\r\nType 'help' for available commands` };
      }
    } catch (error: any) {
      return { output: `Error: ${error.message}` };
    }
  }

  /**
   * List files in directory
   */
  private listFiles(currentPath: string, args: string[]): string {
    const showHidden = args.includes('-a');
    const longFormat = args.includes('-l');
    
    const files = fs.readdirSync(currentPath);
    
    const filtered = showHidden ? files : files.filter((f) => !f.startsWith('.'));
    
    if (longFormat) {
      const lines = filtered.map((file) => {
        const fullPath = path.join(currentPath, file);
        const stats = fs.statSync(fullPath);
        const isDir = stats.isDirectory();
        const size = stats.size;
        const date = stats.mtime.toISOString().split('T')[0];
        
        return `${isDir ? 'd' : '-'}  ${size.toString().padStart(10)}  ${date}  ${file}`;
      });
      
      return lines.join('\r\n');
    } else {
      return filtered.join('  ');
    }
  }

  /**
   * Change directory
   */
  private changeDirectory(
    currentPath: string,
    target: string
  ): { output?: string; newPath?: string } {
    if (!target || target === '~') {
      return { newPath: this.config.rootPath };
    }
    
    if (target === '..') {
      const parent = path.dirname(currentPath);
      
      // Don't allow navigating above root
      if (!parent.startsWith(this.config.rootPath)) {
        return { output: 'Permission denied: cannot navigate above root' };
      }
      
      return { newPath: parent };
    }
    
    const newPath = path.resolve(currentPath, target);
    
    // Security: ensure path is within rootPath
    if (!newPath.startsWith(this.config.rootPath)) {
      return { output: 'Permission denied: path outside root directory' };
    }
    
    if (!fs.existsSync(newPath)) {
      return { output: `No such directory: ${target}` };
    }
    
    if (!fs.statSync(newPath).isDirectory()) {
      return { output: `Not a directory: ${target}` };
    }
    
    return { newPath };
  }

  /**
   * Read file contents
   */
  private readFile(currentPath: string, filename: string): string {
    if (!filename) {
      return 'Usage: cat <filename>';
    }
    
    const filePath = path.resolve(currentPath, filename);
    
    // Security check
    if (!filePath.startsWith(this.config.rootPath)) {
      return 'Permission denied';
    }
    
    if (!fs.existsSync(filePath)) {
      return `File not found: ${filename}`;
    }
    
    if (fs.statSync(filePath).isDirectory()) {
      return `Is a directory: ${filename}`;
    }
    
    // Check file size (don't display huge files)
    const stats = fs.statSync(filePath);
    if (stats.size > 1024 * 1024) {
      // 1MB limit
      return `File too large (${(stats.size / 1024 / 1024).toFixed(2)}MB). Max: 1MB`;
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    return content;
  }

  /**
   * Show directory tree
   */
  private showTree(currentPath: string, subdir: string): string {
    const targetPath = subdir
      ? path.resolve(currentPath, subdir)
      : currentPath;
    
    if (!targetPath.startsWith(this.config.rootPath)) {
      return 'Permission denied';
    }
    
    if (!fs.existsSync(targetPath)) {
      return `Path not found: ${subdir}`;
    }
    
    const lines: string[] = [];
    
    const walk = (dir: string, prefix: string = '', depth: number = 0) => {
      if (depth > 3) return; // Limit depth
      
      const files = fs.readdirSync(dir);
      
      files.forEach((file, index) => {
        if (file.startsWith('.')) return; // Skip hidden
        
        const isLast = index === files.length - 1;
        const fullPath = path.join(dir, file);
        const stats = fs.statSync(fullPath);
        const isDir = stats.isDirectory();
        
        const connector = isLast ? '└── ' : '├── ';
        lines.push(prefix + connector + file + (isDir ? '/' : ''));
        
        if (isDir) {
          const newPrefix = prefix + (isLast ? '    ' : '│   ');
          walk(fullPath, newPrefix, depth + 1);
        }
      });
    };
    
    lines.push(this.getRelativePath(targetPath) + '/');
    walk(targetPath);
    
    return lines.join('\r\n');
  }

  /**
   * Show help
   */
  private showHelp(): string {
    return [
      'Available commands:',
      '  ls [-a] [-l]  - List files (-a: show hidden, -l: long format)',
      '  cd <dir>      - Change directory',
      '  cat <file>    - Display file contents',
      '  pwd           - Print working directory',
      '  tree [dir]    - Show directory tree',
      '  help          - Show this help',
      '  exit          - Close connection',
    ].join('\r\n');
  }

  /**
   * Get path relative to root
   */
  private getRelativePath(fullPath: string): string {
    if (fullPath === this.config.rootPath) {
      return '/';
    }
    return '/' + path.relative(this.config.rootPath, fullPath).replace(/\\/g, '/');
  }

  /**
   * Start SSH server
   */
  public start(): void {
    this.server.listen(this.config.port, this.config.host, () => {
      logger.info(`SSH Server listening on ${this.config.host}:${this.config.port}`);
      logger.info(`  Admin username: ${this.config.adminUsername}`);
      logger.info(`  Access mode: ${this.config.readOnly ? 'READ-ONLY' : 'READ-WRITE'}`);
      logger.info(`  Root path: ${this.config.rootPath}`);
    });
  }

  /**
   * Stop SSH server
   */
  public stop(): void {
    this.server.close(() => {
      logger.info('SSH Server stopped');
    });
  }
}
