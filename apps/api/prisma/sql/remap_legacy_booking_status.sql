-- Run before `prisma db push` when PostgreSQL still has enum variants (PENDING, CONFIRMED)
-- that were removed from schema.prisma. Maps them to CREATED so the enum can be altered.
UPDATE "Booking" SET status = 'CREATED'::"BookingStatus" WHERE status::text IN ('PENDING', 'CONFIRMED');
