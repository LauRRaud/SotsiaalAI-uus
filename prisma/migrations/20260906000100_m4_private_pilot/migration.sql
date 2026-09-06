CREATE TABLE "M4PilotTurn" (
  "id" TEXT PRIMARY KEY, "chatTurnId" TEXT NOT NULL UNIQUE, "pilotId" TEXT NOT NULL,
  "configHash" TEXT NOT NULL, "inputHash" TEXT NOT NULL, "state" TEXT NOT NULL, "payload" JSONB NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "M4PilotTurn_chatTurnId_fkey" FOREIGN KEY ("chatTurnId") REFERENCES "ChatTurn"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "M4PilotTurn_expiresAt_idx" ON "M4PilotTurn"("expiresAt");
CREATE INDEX "M4PilotTurn_pilotId_state_idx" ON "M4PilotTurn"("pilotId", "state");
CREATE TABLE "M4PilotLedger" ("id" TEXT PRIMARY KEY, "configHash" TEXT NOT NULL, "totals" JSONB NOT NULL, "updatedAt" TIMESTAMP(3) NOT NULL);
