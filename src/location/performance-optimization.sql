-- Location Service 성능 최적화를 위한 데이터베이스 인덱스 제안
-- 이 스크립트는 Prisma를 사용하여 적용해야 합니다.

-- 1. 사용자별 위치 조회 성능 최적화
-- CREATE INDEX idx_location_user_timestamp ON LocationLog(userId, timestamp DESC);

-- 2. 동기화 시간 범위 조회 최적화  
-- CREATE INDEX idx_location_timestamp ON LocationLog(timestamp);

-- 3. 중복 데이터 검사 성능 최적화
-- CREATE INDEX idx_location_unique_check ON LocationLog(userId, latitude, longitude, timestamp);

-- Prisma Schema에 추가할 인덱스:
/*
model LocationLog {
  id        String   @id @default(cuid())
  userId    String
  latitude  Float
  longitude Float
  timestamp DateTime
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([userId, timestamp(sort: Desc)], name: "idx_location_user_timestamp")
  @@index([timestamp], name: "idx_location_timestamp")
  @@index([userId, latitude, longitude, timestamp], name: "idx_location_unique_check")
}
*/

-- 성능 모니터링을 위한 쿼리 예시:
-- SELECT COUNT(*) as total_locations, 
--        COUNT(DISTINCT userId) as unique_users,
--        DATE(timestamp) as date
-- FROM LocationLog 
-- WHERE timestamp >= NOW() - INTERVAL 7 DAY
-- GROUP BY DATE(timestamp)
-- ORDER BY date DESC;
