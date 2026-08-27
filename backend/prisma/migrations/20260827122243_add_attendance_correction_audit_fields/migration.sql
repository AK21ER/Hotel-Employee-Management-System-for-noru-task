-- AlterTable
ALTER TABLE "Attendance" ADD COLUMN     "correctedAt" TIMESTAMP(3),
ADD COLUMN     "correctedById" INTEGER;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_correctedById_fkey" FOREIGN KEY ("correctedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
