-- AlterTable
ALTER TABLE "customers" ADD COLUMN "fingerprintDocument" TEXT;
ALTER TABLE "customers" ADD COLUMN "nationalIdDocument" TEXT;
ALTER TABLE "customers" ADD COLUMN "rentalContract" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_notifications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "roleId" TEXT,
    "senderId" TEXT,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "requiresAction" BOOLEAN NOT NULL DEFAULT false,
    "actionType" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "notifications_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_notifications" ("createdAt", "data", "id", "isRead", "message", "title", "type", "userId") SELECT "createdAt", "data", "id", "isRead", "message", "title", "type", "userId" FROM "notifications";
DROP TABLE "notifications";
ALTER TABLE "new_notifications" RENAME TO "notifications";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
