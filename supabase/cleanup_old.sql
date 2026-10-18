-- Optional und einmalig: entfernt Tabellen früherer App-Versionen, die Mia nicht
-- mehr nutzt (Chat, Gedächtnis, Still-/Schlaf-Tracker, Elternprofile, alte
-- Meilenstein-Abfrage, alte Gewichtsliste).
-- Vorher schema.sql ausführen — es übernimmt Meilensteine und Gewichte.
-- ACHTUNG: löscht diese Daten endgültig.

drop table if exists chat_messages;
drop table if exists chat_sessions;
drop table if exists chat_usage;
drop table if exists memories;
drop table if exists feeding_logs;
drop table if exists sleep_logs;
drop table if exists parent_profiles;
drop table if exists milestone_progress;
drop table if exists weight_logs;
