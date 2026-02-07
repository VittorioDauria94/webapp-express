ALTER TABLE `movies_db`.`movies` 
ADD COLUMN `slug` VARCHAR(255) NULL AFTER `id`,
ADD UNIQUE INDEX `slug_UNIQUE` (`slug` ASC) VISIBLE;
;


UPDATE `movies_db`.`movies` SET `slug` = 'inception' WHERE (`id` = '1');
UPDATE `movies_db`.`movies` SET `slug` = 'the-godfather' WHERE (`id` = '2');
UPDATE `movies_db`.`movies` SET `slug` = 'titanic' WHERE (`id` = '3');
UPDATE `movies_db`.`movies` SET `slug` = 'the-matrix' WHERE (`id` = '4');
UPDATE `movies_db`.`movies` SET `slug` = 'interstellar' WHERE (`id` = '5');