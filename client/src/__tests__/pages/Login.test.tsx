import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../context/AuthContext';
import Login from '../../pages/Login';
import '@testing-library/jest-dom';

const MockLogin = () => (
  <BrowserRouter>
    <AuthProvider>
      <Login />
    </AuthProvider>
  </BrowserRouter>
);

describe('Login Page', () => {
  it('renders login form with email and password fields', () => {
    render(<MockLogin />);
    
    expect(screen.getByLabelText(/email|البريد الإلكتروني/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password|كلمة المرور/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login|دخول/i })).toBeInTheDocument();
  });

  it('displays error message for empty fields', async () => {
    render(<MockLogin />);
    
    const loginButton = screen.getByRole('button', { name: /login|دخول/i });
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(screen.getByText(/email is required|البريد الإلكتروني مطلوب/i)).toBeInTheDocument();
    });
  });

  it('displays error message for invalid email format', async () => {
    render(<MockLogin />);
    
    const emailInput = screen.getByLabelText(/email|البريد الإلكتروني/i);
    const loginButton = screen.getByRole('button', { name: /login|دخول/i });

    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid email|بريد إلكتروني غير صحيح/i)).toBeInTheDocument();
    });
  });

  it('submits form with valid credentials', async () => {
    const mockLogin = jest.fn().mockResolvedValue({ success: true });
    
    // Mock API call
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ token: 'fake-token', user: { email: 'admin@baron.local' } }),
      })
    ) as jest.Mock;

    render(<MockLogin />);
    
    const emailInput = screen.getByLabelText(/email|البريد الإلكتروني/i);
    const passwordInput = screen.getByLabelText(/password|كلمة المرور/i);
    const loginButton = screen.getByRole('button', { name: /login|دخول/i });

    fireEvent.change(emailInput, { target: { value: 'admin@baron.local' } });
    fireEvent.change(passwordInput, { target: { value: 'Admin123!' } });
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/login'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('admin@baron.local'),
        })
      );
    });
  });

  it('displays error message for incorrect credentials', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'Invalid credentials' }),
      })
    ) as jest.Mock;

    render(<MockLogin />);
    
    const emailInput = screen.getByLabelText(/email|البريد الإلكتروني/i);
    const passwordInput = screen.getByLabelText(/password|كلمة المرور/i);
    const loginButton = screen.getByRole('button', { name: /login|دخول/i });

    fireEvent.change(emailInput, { target: { value: 'wrong@baron.local' } });
    fireEvent.change(passwordInput, { target: { value: 'WrongPass123!' } });
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials|بيانات غير صحيحة/i)).toBeInTheDocument();
    });
  });
});
