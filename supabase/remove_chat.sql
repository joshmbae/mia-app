-- Einmalig ausführen, um alles zu entfernen, was zum Mia-Chat gehörte:
-- Gespräche, Nachrichten, das "Gedächtnis" und die Chat-Kontingente.
-- ACHTUNG: löscht diese Daten endgültig.

drop table if exists chat_messages;
drop table if exists chat_sessions;
drop table if exists memories;
drop table if exists chat_usage;
