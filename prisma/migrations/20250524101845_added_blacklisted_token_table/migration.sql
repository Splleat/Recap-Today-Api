-- CreateTable
CREATE TABLE "blacklisted_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blacklisted_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "blacklisted_tokens_token_key" ON "blacklisted_tokens"("token");
