-- Preserve the legacy role long enough to map existing accounts safely.
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','seeker','agent','moderator','admin') NOT NULL DEFAULT 'seeker';
UPDATE `users` AS u
LEFT JOIN `agent_profiles` AS ap ON ap.`userId` = u.`id`
SET u.`role` = CASE WHEN ap.`id` IS NULL THEN 'seeker' ELSE 'agent' END
WHERE u.`role` = 'user';
ALTER TABLE `users` MODIFY COLUMN `role` enum('seeker','agent','moderator','admin') NOT NULL DEFAULT 'seeker';
