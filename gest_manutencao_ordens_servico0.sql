-- MySQL dump 10.13  Distrib 8.0.42, for Win64 (x86_64)
--
-- Host: localhost    Database: gest_manutencao
-- ------------------------------------------------------
-- Server version	8.0.42

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
-- Table structure for table `ordens_servico`
--

DROP TABLE IF EXISTS `ordens_servico`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ordens_servico` (
  `id` int NOT NULL AUTO_INCREMENT,
  `chamado_id` int DEFAULT NULL,
  `equipamento_id` int NOT NULL,
  `tipo_os` varchar(100) DEFAULT NULL,
  `descricao` text,
  `tecnico_id` int DEFAULT NULL,
  `data_aceite` datetime DEFAULT NULL,
  `status` varchar(50) DEFAULT 'Aberta',
  `data_abertura` datetime DEFAULT CURRENT_TIMESTAMP,
  `data_prev_conclusao` date DEFAULT NULL,
  `data_conclusao` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `chamado_id` (`chamado_id`),
  KEY `equipamento_id` (`equipamento_id`),
  KEY `fk_ordens_servico_tecnico` (`tecnico_id`),
  CONSTRAINT `fk_ordens_servico_equipamento` FOREIGN KEY (`equipamento_id`) REFERENCES `equipamentos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ordens_servico_tecnico` FOREIGN KEY (`tecnico_id`) REFERENCES `tecnicos` (`id`) ON DELETE SET NULL,
  CONSTRAINT `ordens_servico_ibfk_2` FOREIGN KEY (`equipamento_id`) REFERENCES `equipamentos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ordens_servico`
--

LOCK TABLES `ordens_servico` WRITE;
/*!40000 ALTER TABLE `ordens_servico` DISABLE KEYS */;
INSERT INTO `ordens_servico` VALUES (5,NULL,8,'Elétrico','sd',4,NULL,'Alta','2025-06-20 00:00:00',NULL,'2025-06-20 00:00:00'),(6,NULL,13,'Mecânico','asdas',5,NULL,'Média','2025-06-20 00:00:00',NULL,NULL),(7,NULL,8,'Elétrico','asdasd',4,NULL,'Baixa','2025-06-20 00:00:00',NULL,NULL),(8,NULL,8,'Mecânico','bvnvbn',5,NULL,'Alta','2025-06-20 00:00:00',NULL,NULL);
/*!40000 ALTER TABLE `ordens_servico` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-06-20 18:04:12
