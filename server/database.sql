CREATE DATABASE  IF NOT EXISTS `gofit_db` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `gofit_db`;
-- MySQL dump 10.13  Distrib 8.0.41, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: gofit_db
-- ------------------------------------------------------
-- Server version	8.0.41

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `bodydetails`
--

DROP TABLE IF EXISTS `bodydetails`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bodydetails` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `weight` float DEFAULT NULL,
  `height` float DEFAULT NULL,
  `body_fat` float DEFAULT NULL,
  `muscle_mass` float DEFAULT NULL,
  `circumference` float DEFAULT NULL,
  `recorded_at` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_bodydetails_user` (`user_id`),
  CONSTRAINT `fk_bodydetails_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bodydetails`
--

LOCK TABLES `bodydetails` WRITE;
/*!40000 ALTER TABLE `bodydetails` DISABLE KEYS */;
INSERT INTO `bodydetails` VALUES (2,3,50,165,21,30,86,'2025-09-22'),(4,10,15,15,15,15,1515,'2025-09-23'),(5,11,NULL,NULL,NULL,NULL,NULL,'2025-09-23'),(7,13,22,150,22,22,22,'2025-09-30'),(8,14,99,99,50,99,99,'2025-10-04'),(9,15,88,88,28,88,88,'2025-10-04'),(10,16,50,170,50,50,50,'2025-10-23'),(11,13,70,160,15,50,90,'2025-10-22'),(12,13,70,175,25,50,95,'2025-08-01');
/*!40000 ALTER TABLE `bodydetails` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `exercises`
--

DROP TABLE IF EXISTS `exercises`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `exercises` (
  `id` int NOT NULL AUTO_INCREMENT,
  `exercise_name` varchar(255) NOT NULL,
  `category` varchar(100) NOT NULL,
  `description` text,
  `muscle_group` varchar(100) DEFAULT NULL,
  `difficulty` enum('beginner','intermediate','advanced') DEFAULT NULL,
  `equipment` varchar(100) DEFAULT NULL,
  `video_url` varchar(255) DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `exercises_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `exercises`
--

LOCK TABLES `exercises` WRITE;
/*!40000 ALTER TABLE `exercises` DISABLE KEYS */;
INSERT INTO `exercises` VALUES (1,'Squat','כוח','תרגיל לפלג גוף תחתון','רגליים','beginner','משקולות','https://i.pinimg.com/originals/07/48/5c/07485c73c14b3d6b8aabf9b049e287c4.gif',10,'2025-10-21 00:37:52','2025-10-22 17:30:17'),(2,'Bench Press','כוח','תרגיל לחזה','חזה','intermediate','משקולות, ספסל','https://i.pinimg.com/originals/a9/77/9c/a9779c83c9eaf4d81d0546b25fdfa83e.gif',10,'2025-10-21 00:37:52','2025-10-22 17:29:37'),(3,'Deadlift','כוח','תרגיל מלא לגוף','גב','advanced','משקולות','https://www.youtube.com/watch?v=AweC3UaM14o',10,'2025-10-21 00:37:52','2025-10-21 19:13:05'),(4,'Push Up','כוח','תרגיל לחזה וידיים','חזה','beginner','גוף','https://i.pinimg.com/originals/cd/d6/e1/cdd6e1b3ab31e64976660564ad28dcac.gif',10,'2025-10-21 00:37:52','2025-10-22 17:29:55'),(5,'Running','קרדיו','ריצה למרחק','רגליים','beginner','ריצה',NULL,10,'2025-10-21 00:37:52','2025-10-21 00:37:52');
/*!40000 ALTER TABLE `exercises` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `invoice_items`
--

DROP TABLE IF EXISTS `invoice_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `invoice_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `invoice_id` int NOT NULL,
  `description` varchar(255) NOT NULL,
  `quantity` int DEFAULT '1',
  `unit_price` decimal(10,2) NOT NULL,
  `total_price` decimal(10,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `invoice_id` (`invoice_id`),
  CONSTRAINT `invoice_items_ibfk_1` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `invoice_items`
--

LOCK TABLES `invoice_items` WRITE;
/*!40000 ALTER TABLE `invoice_items` DISABLE KEYS */;
INSERT INTO `invoice_items` VALUES (1,1,'מנוי חודשי',1,150.00,150.00,'2025-10-23 18:28:07'),(2,2,'מנוי חודשי',1,150.00,150.00,'2025-10-23 18:28:07'),(3,3,'מנוי חודשי',1,150.00,150.00,'2025-10-23 18:28:07'),(4,4,'מנוי חודשי',1,150.00,150.00,'2025-10-23 18:28:07'),(5,5,'מנוי חודשי',1,150.00,150.00,'2025-10-23 18:28:07'),(7,7,'מנוי חודשי',1,150.00,150.00,'2025-10-23 18:28:07'),(8,8,'מנוי חודשי',1,150.00,150.00,'2025-10-23 18:28:07'),(9,9,'מנוי חודשי',1,150.00,150.00,'2025-10-23 18:28:07');
/*!40000 ALTER TABLE `invoice_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `invoices`
--

DROP TABLE IF EXISTS `invoices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `invoices` (
  `id` int NOT NULL AUTO_INCREMENT,
  `subscription_id` int NOT NULL,
  `user_id` int NOT NULL,
  `invoice_number` varchar(50) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `tax_amount` decimal(10,2) DEFAULT '0.00',
  `total_amount` decimal(10,2) NOT NULL,
  `status` enum('pending','paid','overdue','cancelled') DEFAULT 'pending',
  `due_date` date NOT NULL,
  `paid_at` datetime DEFAULT NULL,
  `payment_method` varchar(50) DEFAULT NULL,
  `notes` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `invoice_number` (`invoice_number`),
  KEY `subscription_id` (`subscription_id`),
  KEY `idx_invoice_number` (`invoice_number`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_status` (`status`),
  KEY `idx_due_date` (`due_date`),
  CONSTRAINT `invoices_ibfk_1` FOREIGN KEY (`subscription_id`) REFERENCES `subscriptions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `invoices_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `invoices`
--

LOCK TABLES `invoices` WRITE;
/*!40000 ALTER TABLE `invoices` DISABLE KEYS */;
INSERT INTO `invoices` VALUES (1,14,10,'INV-1761244082-14',150.00,0.00,150.00,'cancelled','2025-10-23',NULL,NULL,'חשבונית עבור מנוי חודשי','2025-10-23 18:28:02','2025-10-23 18:28:02'),(2,15,11,'INV-1761244082-15',150.00,0.00,150.00,'paid','2025-10-23',NULL,NULL,'חשבונית עבור מנוי חודשי','2025-10-23 18:28:02','2025-10-23 18:28:02'),(3,18,13,'INV-1761244082-18',150.00,0.00,150.00,'paid','2025-10-30',NULL,NULL,'חשבונית עבור מנוי חודשי','2025-10-23 18:28:02','2025-10-23 18:28:02'),(4,19,14,'INV-1761244082-19',150.00,0.00,150.00,'cancelled','2025-11-02',NULL,NULL,'חשבונית עבור מנוי חודשי','2025-10-23 18:28:02','2025-10-23 19:28:07'),(5,20,15,'INV-1761244082-20',150.00,0.00,150.00,'paid','2025-11-03',NULL,NULL,'חשבונית עבור מנוי חודשי','2025-10-23 18:28:02','2025-10-23 18:28:02'),(7,23,11,'INV-1761244082-23',150.00,0.00,150.00,'pending','2025-11-22',NULL,NULL,'חשבונית עבור מנוי חודשי','2025-10-23 18:28:02','2025-10-23 18:28:02'),(8,24,15,'INV-1761244082-24',150.00,0.00,150.00,'paid','2025-11-22',NULL,NULL,'חשבונית עבור מנוי חודשי','2025-10-23 18:28:02','2025-10-23 18:28:02'),(9,25,3,'INV-1761244082-25',150.00,0.00,150.00,'paid','2025-11-22',NULL,NULL,'חשבונית עבור מנוי חודשי','2025-10-23 18:28:02','2025-10-23 18:28:02');
/*!40000 ALTER TABLE `invoices` ENABLE KEYS */;
UNLOCK TABLES;



USE `gofit_db`;

-- Table for storing browser push subscriptions
DROP TABLE IF EXISTS `push_subscriptions`;
CREATE TABLE `push_subscriptions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `endpoint` varchar(512) NOT NULL,
  `p256dh` varchar(255) NOT NULL,
  `auth` varchar(255) NOT NULL,
  `browser` varchar(50) DEFAULT NULL,
  `device_info` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_endpoint` (`endpoint`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_is_active` (`is_active`),
  KEY `idx_updated_at` (`updated_at`),
  KEY `idx_active_user` (`user_id`, `is_active`),
  CONSTRAINT `fk_push_subscriptions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table for storing notification history
DROP TABLE IF EXISTS `notifications`;
CREATE TABLE `notifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `title` varchar(255) NOT NULL,
  `body` text NOT NULL,
  `data` json DEFAULT NULL,
  `type` varchar(50) NOT NULL,
  `status` enum('pending','sent','failed') DEFAULT 'pending',
  `read_at` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `sent_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_type` (`type`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_read_at` (`read_at`),
  KEY `idx_user_read` (`user_id`, `read_at`),
  KEY `idx_user_created` (`user_id`, `created_at`),
  KEY `idx_cleanup_read` (`read_at`, `created_at`),
  CONSTRAINT `fk_notifications_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table for user notification preferences
DROP TABLE IF EXISTS `notification_preferences`;
CREATE TABLE `notification_preferences` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `preference_type` varchar(50) NOT NULL,
  `enabled` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_preference` (`user_id`, `preference_type`),
  KEY `idx_user_id` (`user_id`),
  CONSTRAINT `fk_notification_preferences_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;







--
-- Table structure for table `permissions_catalog`
--

DROP TABLE IF EXISTS `permissions_catalog`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `permissions_catalog` (
  `perm_key` varchar(64) NOT NULL,
  `is_readonly_safe` tinyint(1) NOT NULL DEFAULT '0',
  `description` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`perm_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permissions_catalog`
--

LOCK TABLES `permissions_catalog` WRITE;
/*!40000 ALTER TABLE `permissions_catalog` DISABLE KEYS */;
INSERT INTO `permissions_catalog` VALUES ('create_invoices',0,'יכול ליצור חשבוניות'),('create_subscriptions',0,'יכול ליצור מנויים חדשים'),('create_users',0,'יכול ליצור משתמשים חדשים'),('delete_subscriptions',0,'יכול למחוק מנויים'),('delete_users',0,'יכול למחוק משתמשים'),('edit_invoices',0,'יכול לערוך חשבוניות'),('edit_subscriptions',0,'יכול לערוך מנויים קיימים'),('edit_users',0,'יכול לערוך משתמשים קיימים'),('manage_classes',0,'יכול לנהל שיעורים'),('manage_notifications',0,'יכול לנהל התראות'),('manage_payment_status',0,'יכול לעדכן סטטוס תשלום'),('manage_permissions',0,'יכול להגדיר פרופילי גישה והרשאות'),('manage_plans',0,'יכול לנהל תוכניות אימון'),('manage_staff_roles',0,'יכול להקצות תפקידי צוות (מאמן/מנהל)'),('manage_subscription_plans',0,'יכול לנהל סוגי מנויים ומחירים'),('manage_subscriptions',0,'יכול להקפיא, לשחזר ולבטל מנויים'),('refund_payments',0,'יכול לבצע החזרים'),('view_analytics',1,'יכול לצפות בסטטיסטיקות ואנליטיקה'),('view_dashboard',1,'יכול לצפות בלוח הבקרה הראשי'),('view_invoices',1,'יכול לצפות בחשבוניות'),('view_notifications',1,'יכול לצפות בהתראות'),('view_subscriptions',1,'יכול לצפות במנויים'),('view_users',1,'יכול לצפות ברשימת משתמשים ופרטים');
/*!40000 ALTER TABLE `permissions_catalog` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `role_presets`
--

DROP TABLE IF EXISTS `role_presets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `role_presets` (
  `role` enum('trainee','trainer','admin') NOT NULL,
  `perm_key` varchar(64) NOT NULL,
  PRIMARY KEY (`role`,`perm_key`),
  KEY `fk_preset_perm` (`perm_key`),
  CONSTRAINT `fk_preset_perm` FOREIGN KEY (`perm_key`) REFERENCES `permissions_catalog` (`perm_key`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `role_presets`
--

LOCK TABLES `role_presets` WRITE;
/*!40000 ALTER TABLE `role_presets` DISABLE KEYS */;
INSERT INTO `role_presets` VALUES ('admin','create_invoices'),('admin','create_subscriptions'),('trainer','create_users'),('admin','create_users'),('admin','delete_subscriptions'),('admin','delete_users'),('admin','edit_invoices'),('admin','edit_subscriptions'),('trainer','edit_users'),('admin','edit_users'),('trainer','manage_classes'),('admin','manage_classes'),('admin','manage_notifications'),('trainer','manage_payment_status'),('admin','manage_payment_status'),('admin','manage_permissions'),('trainer','manage_plans'),('admin','manage_plans'),('admin','manage_staff_roles'),('admin','manage_subscription_plans'),('trainer','manage_subscriptions'),('admin','manage_subscriptions'),('admin','refund_payments'),('trainer','view_analytics'),('admin','view_analytics'),('trainer','view_dashboard'),('admin','view_dashboard'),('trainer','view_invoices'),('admin','view_invoices'),('trainee','view_notifications'),('trainer','view_notifications'),('admin','view_notifications'),('trainer','view_subscriptions'),('admin','view_subscriptions'),('trainer','view_users'),('admin','view_users');
/*!40000 ALTER TABLE `role_presets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `subscription_plans`
--

DROP TABLE IF EXISTS `subscription_plans`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `subscription_plans` (
  `id` int NOT NULL AUTO_INCREMENT,
  `plan_name` varchar(100) NOT NULL,
  `plan_type` enum('monthly','quarterly','yearly','custom') NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `duration_days` int NOT NULL,
  `description` text,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `subscription_plans`
--

LOCK TABLES `subscription_plans` WRITE;
/*!40000 ALTER TABLE `subscription_plans` DISABLE KEYS */;
INSERT INTO `subscription_plans` VALUES (1,'מנוי חודשי','monthly',150.00,30,'מנוי חודשי עם גישה מלאה לכל השירותים',1,'2025-10-23 18:27:35','2025-10-23 18:27:35'),(2,'מנוי רבעוני','quarterly',400.00,90,'מנוי ל-3 חודשים עם הנחה של 10%',1,'2025-10-23 18:27:35','2025-10-23 18:27:35'),(3,'מנוי שנתי','yearly',1500.00,365,'מנוי שנתי עם הנחה של 15%',1,'2025-10-23 18:27:35','2025-10-23 18:27:35'),(4,'מנוי ניסיון','custom',50.00,7,'מנוי ניסיון לשבוע אחד',1,'2025-10-23 18:27:35','2025-10-23 18:27:35');
/*!40000 ALTER TABLE `subscription_plans` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `subscriptions`
--

DROP TABLE IF EXISTS `subscriptions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `subscriptions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `cancelled_at` datetime DEFAULT NULL,
  `paused_at` date DEFAULT NULL,
  `payment_status` varchar(20) NOT NULL DEFAULT 'pending',
  `price` decimal(10,2) DEFAULT '0.00',
  `plan_type` varchar(50) DEFAULT 'monthly',
  `plan_name` varchar(100) DEFAULT 'מנוי חודשי',
  `plan_id` int DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_subscriptions_user_id` (`user_id`),
  KEY `idx_sub_user_end` (`user_id`,`end_date`),
  KEY `fk_subscriptions_plan` (`plan_id`),
  CONSTRAINT `fk_subscriptions_plan` FOREIGN KEY (`plan_id`) REFERENCES `subscription_plans` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_subscriptions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `subscriptions`
--

LOCK TABLES `subscriptions` WRITE;
/*!40000 ALTER TABLE `subscriptions` DISABLE KEYS */;
INSERT INTO `subscriptions` VALUES (14,10,'2025-09-23','2025-10-24',NULL,NULL,'refunded',150.00,'monthly','מנוי חודשי',1,'2025-09-23 03:11:03','2025-10-23 18:27:35'),(15,11,'2025-09-23','2025-09-27',NULL,NULL,'paid',150.00,'monthly','מנוי חודשי',1,'2025-09-23 14:55:23','2025-10-23 18:27:35'),(18,13,'2025-09-30','2025-10-15',NULL,NULL,'paid',150.00,'monthly','מנוי חודשי',1,'2025-09-30 13:10:07','2025-10-23 18:27:35'),(19,14,'2025-10-03','2025-11-15',NULL,'2025-10-23','failed',150.00,'monthly','מנוי חודשי',1,'2025-10-04 08:26:14','2025-10-23 18:27:35'),(20,15,'2025-10-04','2025-10-06','2025-10-23 16:22:54',NULL,'paid',150.00,'monthly','מנוי חודשי',1,'2025-10-04 08:27:50','2025-10-23 18:27:35'),(23,11,'2025-10-23','2025-10-24',NULL,NULL,'pending',150.00,'monthly','מנוי חודשי',1,'2025-10-23 13:09:28','2025-10-23 18:27:35'),(24,15,'2025-10-23','2025-10-24',NULL,NULL,'paid',150.00,'monthly','מנוי חודשי',1,'2025-10-23 13:19:15','2025-10-23 18:27:35'),(25,3,'2025-10-23','2025-10-24',NULL,NULL,'paid',150.00,'monthly','מנוי חודשי',1,'2025-10-23 13:23:23','2025-10-23 18:27:35'),(26,13,'2025-10-23','2025-10-24',NULL,NULL,'paid',0.00,'monthly','מנוי חודשי',NULL,'2025-10-23 19:04:15','2025-10-23 19:04:15'),(27,16,'2025-10-23','2025-10-24',NULL,NULL,'paid',0.00,'monthly','מנוי חודשי',NULL,'2025-10-23 19:06:52','2025-10-23 19:06:52');
/*!40000 ALTER TABLE `subscriptions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `trainingprogram`
--

DROP TABLE IF EXISTS `trainingprogram`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `trainingprogram` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `program_name` varchar(255) NOT NULL,
  `created_by` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `trainingprogram_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `trainingprogram_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `trainingprogram`
--

LOCK TABLES `trainingprogram` WRITE;
/*!40000 ALTER TABLE `trainingprogram` DISABLE KEYS */;
INSERT INTO `trainingprogram` VALUES (1,16,'תוכנית אימונים - yosi',10,'2025-10-21 18:58:38','2025-10-21 18:58:38'),(2,13,'תוכנית אימונים - test22',10,'2025-10-21 19:01:21','2025-10-21 19:01:21'),(4,13,'תוכנית אימונים - test22',10,'2025-10-21 19:12:35','2025-10-21 19:12:35');
/*!40000 ALTER TABLE `trainingprogram` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `trainingprogram_exercises`
--

DROP TABLE IF EXISTS `trainingprogram_exercises`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `trainingprogram_exercises` (
  `id` int NOT NULL AUTO_INCREMENT,
  `training_program_id` int NOT NULL,
  `exercise_id` int NOT NULL,
  `sets` varchar(50) NOT NULL,
  `reps` varchar(50) NOT NULL,
  `duration` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_program_exercise` (`training_program_id`,`exercise_id`),
  KEY `exercise_id` (`exercise_id`),
  CONSTRAINT `trainingprogram_exercises_ibfk_1` FOREIGN KEY (`training_program_id`) REFERENCES `trainingprogram` (`id`) ON DELETE CASCADE,
  CONSTRAINT `trainingprogram_exercises_ibfk_2` FOREIGN KEY (`exercise_id`) REFERENCES `exercises` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `trainingprogram_exercises`
--

LOCK TABLES `trainingprogram_exercises` WRITE;
/*!40000 ALTER TABLE `trainingprogram_exercises` DISABLE KEYS */;
INSERT INTO `trainingprogram_exercises` VALUES (1,1,5,'3','12',5),(2,1,4,'3','12',5),(3,1,1,'3','12',5),(4,1,2,'3','12',5),(5,1,3,'3','12',5),(6,2,2,'3','12',5),(7,2,3,'3','12',5),(8,2,5,'3','12',5),(10,4,3,'2','3',2),(11,4,4,'3','12',5),(14,4,5,'3','12',1),(15,4,1,'3','12',1),(16,4,2,'3','12',1);
/*!40000 ALTER TABLE `trainingprogram_exercises` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `phone` varchar(20) NOT NULL,
  `username` varchar(100) NOT NULL,
  `birth_date` date NOT NULL,
  `role` enum('trainee','trainer','admin') NOT NULL DEFAULT 'trainee',
  `gender` varchar(20) DEFAULT NULL,
  `password` varchar(100) DEFAULT NULL,
  `access_profile` enum('default','readonly','custom') NOT NULL DEFAULT 'default',
  `permissions_json` json DEFAULT NULL COMMENT 'רשימת הרשאות אפקטיבית כאשר profile=custom',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_users_phone` (`phone`),
  KEY `idx_users_role` (`role`),
  KEY `idx_users_access_profile` (`access_profile`),
  CONSTRAINT `chk_users_gender` CHECK ((`gender` in (_utf8mb4'male',_utf8mb4'female'))),
  CONSTRAINT `chk_users_role` CHECK ((`role` in (_utf8mb4'trainee',_utf8mb4'trainer',_utf8mb4'admin')))
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (3,'0545398871','RAADHENO2','2025-09-06','trainer','male','507f513353702b50c145d5b7d138095c','default','[\"create_users\", \"edit_users\", \"manage_classes\", \"manage_payment_status\", \"manage_plans\", \"view_analytics\", \"view_subscriptions\", \"view_users\"]'),(10,'0545398877','faez','2025-09-23','admin','male','507f513353702b50c145d5b7d138095c','default','[\"create_subscriptions\", \"create_users\", \"delete_subscriptions\", \"delete_users\", \"edit_subscriptions\", \"edit_users\", \"manage_classes\", \"manage_notifications\", \"manage_payment_status\", \"manage_permissions\", \"manage_plans\", \"manage_staff_roles\", \"refund_payments\", \"view_analytics\", \"view_subscriptions\", \"view_users\"]'),(11,'0545398875','ameer','2025-09-23','trainer','male','507f513353702b50c145d5b7d138095c','readonly','[\"view_analytics\", \"view_subscriptions\", \"view_users\"]'),(13,'0545398879','test22','2000-02-29','trainee','male','507f513353702b50c145d5b7d138095c','default','[\"view_notifications\"]'),(14,'0545398872','haha','2007-06-12','admin','female','507f513353702b50c145d5b7d138095c','default','[\"create_subscriptions\", \"create_users\", \"delete_subscriptions\", \"delete_users\", \"edit_subscriptions\", \"edit_users\", \"manage_classes\", \"manage_notifications\", \"manage_payment_status\", \"manage_permissions\", \"manage_plans\", \"manage_staff_roles\", \"refund_payments\", \"view_analytics\", \"view_subscriptions\", \"view_users\"]'),(15,'0545398870','hehe','2024-02-04','admin','female','31ad2f10870bb5e4c517357bf9f95e58','custom','[\"staff.manage\", \"plans.manage\", \"payments.view\", \"payments.refund\", \"notifications.manage\", \"users.view\", \"users.edit\", \"view_dashboard\"]'),(16,'0545398866','yossi','2019-06-12','trainee','male','7367cc4cee061a476290d18978830414','default','[\"view_notifications\"]');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `workout_history`
--

DROP TABLE IF EXISTS `workout_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `workout_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `program_id` int DEFAULT NULL,
  `program_name` varchar(255) NOT NULL,
  `start_time` datetime NOT NULL,
  `end_time` datetime NOT NULL,
  `completed_exercises` json NOT NULL,
  `total_exercises` int NOT NULL,
  `duration_minutes` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_program_id` (`program_id`),
  KEY `idx_start_time` (`start_time`),
  KEY `idx_user_start_time` (`user_id`,`start_time`),
  CONSTRAINT `workout_history_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `workout_history_ibfk_2` FOREIGN KEY (`program_id`) REFERENCES `trainingprogram` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `workout_history`
--

LOCK TABLES `workout_history` WRITE;
/*!40000 ALTER TABLE `workout_history` DISABLE KEYS */;
INSERT INTO `workout_history` VALUES (1,13,4,'תוכנית אימונים - test22','2025-10-22 13:25:46','2025-10-22 13:25:49','[0, 1]',2,0,'2025-10-22 13:25:49','2025-10-22 13:25:49'),(2,13,2,'תוכנית אימונים - test22','2025-10-22 13:26:06','2025-10-22 13:26:10','[0, 1, 2]',3,0,'2025-10-22 13:26:10','2025-10-22 13:26:10'),(3,13,4,'תוכנית אימונים - test22','2025-10-22 13:29:39','2025-10-22 13:29:40','[0]',2,0,'2025-10-22 13:29:40','2025-10-22 13:29:40'),(4,13,2,'תוכנית אימונים - test22','2025-10-22 13:38:58','2025-10-22 13:39:00','[0, 1]',3,0,'2025-10-22 13:39:00','2025-10-22 13:39:00'),(5,13,4,'תוכנית אימונים - test22','2025-10-22 13:49:29','2025-10-22 13:49:31','[0]',2,0,'2025-10-22 13:49:31','2025-10-22 13:49:31'),(6,13,2,'תוכנית אימונים - test22','2025-10-22 13:49:38','2025-10-22 13:49:41','[0, 1, 2]',3,0,'2025-10-22 13:49:41','2025-10-22 13:49:41'),(7,13,4,'תוכנית אימונים - test22','2025-10-22 14:25:01','2025-10-22 14:25:03','[0, 1]',2,0,'2025-10-22 14:25:03','2025-10-22 14:25:03'),(8,13,4,'תוכנית אימונים - test22','2025-10-22 14:25:08','2025-10-22 14:25:10','[0, 1]',2,0,'2025-10-22 14:25:10','2025-10-22 14:25:10'),(9,13,4,'תוכנית אימונים - test22','2025-10-22 14:25:14','2025-10-22 14:25:15','[0]',2,0,'2025-10-22 14:25:15','2025-10-22 14:25:15'),(10,13,4,'תוכנית אימונים - test22','2025-10-22 14:25:19','2025-10-22 14:25:21','[0, 1]',2,0,'2025-10-22 14:25:21','2025-10-22 14:25:21'),(11,13,4,'תוכנית אימונים - test22','2025-10-22 17:39:48','2025-10-22 17:41:23','[0, 1, 2, 3, 4]',5,2,'2025-10-22 17:41:23','2025-10-22 17:41:23');
/*!40000 ALTER TABLE `workout_history` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-10-24 21:09:19
