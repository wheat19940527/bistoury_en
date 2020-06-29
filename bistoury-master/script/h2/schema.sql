DROP TABLE IF EXISTS bistoury_app;
CREATE TABLE bistoury_app
(
    id          INT UNSIGNED auto_increment PRIMARY KEY,
    code        VARCHAR(50) DEFAULT ''                NOT NULL COMMENT 'Application code',
    name        VARCHAR(50) DEFAULT ''                NOT NULL COMMENT 'Application name',
    group_code  VARCHAR(50) DEFAULT ''                NOT NULL COMMENT 'Group code',
    status      TINYINT     DEFAULT 0                 NOT NULL COMMENT 'Status, 0=Un-passed，1=Pass, 2=Reject, 3=Destroy',
    creator     VARCHAR(50) DEFAULT ''                NOT NULL COMMENT 'Creator',
    create_time TIMESTAMP   DEFAULT CURRENT_TIMESTAMP NOT NULL COMMENT 'create time',
    CONSTRAINT uniq_code UNIQUE (CODE)
) charset = utf8mb4;

DROP TABLE IF EXISTS bistoury_user_app;
CREATE TABLE bistoury_user_app
(
    id          INT UNSIGNED auto_increment PRIMARY KEY,
    app_code    VARCHAR(50)                         NOT NULL COMMENT 'Application code',
    user_code   VARCHAR(50)                         NOT NULL COMMENT 'User code',
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL COMMENT 'Create time',
    CONSTRAINT uniq_app_user UNIQUE (app_code, user_code)
) charset = utf8mb4;

CREATE INDEX idx_app_code ON bistoury_user_app (app_code);
CREATE INDEX idx_user_code ON bistoury_user_app (user_code);

DROP TABLE IF EXISTS bistoury_server;
CREATE TABLE bistoury_server
(
    id                     BIGINT(11) UNSIGNED auto_increment COMMENT 'primary key' PRIMARY KEY,
    server_id              varchar(32)  default '' not null comment 'server id',
    ip                     VARCHAR(15)  DEFAULT '' NOT NULL COMMENT 'server ip',
    port                   INT UNSIGNED DEFAULT 0  NOT NULL COMMENT 'server port',
    host                   VARCHAR(100) DEFAULT '' NOT NULL COMMENT 'server host',
    log_dir                VARCHAR(255) DEFAULT '' NOT NULL COMMENT 'server log dir',
    room                   VARCHAR(20)  DEFAULT '' NOT NULL COMMENT 'server room',
    app_code               varchar(50)  default '' not null comment 'correspond app_code',
    auto_jstack_enable     tinyint      default 0  not null comment 'Auto jstack status：0 close, 1 open',
    auto_jmap_histo_enable tinyint      default 0  not null comment 'Auto jmap histo status：0 close, 1 open',
    index idx_server_app_code (app_code),
    constraint uniq_server_id unique (server_id),
    CONSTRAINT uniq_ip UNIQUE (ip)
) charset = utf8mb4;

DROP TABLE IF EXISTS `bistoury_gitlab_token`;
CREATE TABLE `bistoury_gitlab_token`
(
    `id`            int(10) unsigned NOT NULL AUTO_INCREMENT COMMENT 'id',
    `user_code`     varchar(50)      NOT NULL DEFAULT '' COMMENT 'user code',
    `private_token` varchar(100)     NOT NULL DEFAULT '' COMMENT 'gitlab private token',
    `create_time`   timestamp        NOT NULL DEFAULT '1970-01-01 08:00:01' COMMENT 'create time',
    `update_time`   timestamp        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'update time',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uniq_git_user_code` (`user_code`)
) CHARSET = utf8mb4;

DROP TABLE if exists `bistoury_user`;
create table `bistoury_user`
(
    id        int unsigned auto_increment comment 'primary key' primary key,
    user_code varchar(50)  not null default '' comment 'user code',
    password  varchar(100) not null default '' comment 'password',
    constraint uniq_user_code unique (user_code)
) CHARSET = utf8mb4;

DROP TABLE IF EXISTS `bistoury_profiler_lock`;
CREATE TABLE `bistoury_profiler_lock`
(
    `id`       INT(10) UNSIGNED       NOT NULL AUTO_INCREMENT COMMENT 'id',
    `app_code` VARCHAR(50) DEFAULT '' NOT NULL COMMENT 'Correspond appCode',
    `agent_id` VARCHAR(32) DEFAULT '' NOT NULL COMMENT 'agent correspond id',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uniq_app_code_agent_id` (`app_code`, `agent_id`)
) CHARSET = utf8mb4;

DROP TABLE IF EXISTS `bistoury_profiler`;
CREATE TABLE `bistoury_profiler`
(
    `id`          INT(10) UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'id',
    `profiler_id` VARCHAR(32)      NOT NULL COMMENT 'Performance analysis correspond id',
    `operator`    VARCHAR(50)      NOT NULL DEFAULT '' COMMENT 'Operator code',
    `app_code`    VARCHAR(50)      NOT NULL DEFAULT '' COMMENT 'Correspond appCode',
    `agent_id`    VARCHAR(32)      NOT NULL DEFAULT '' COMMENT 'agent correspond id',
    `duration`    INT(10)          NOT NULL COMMENT 'Performance analysis duration (s)',
    `interval_ms`   INT(10)          NOT NULL COMMENT 'Sample interval interval, (ms)',
    `mode`        INT(3) UNSIGNED  NOT NULL COMMENT 'Analysis mode, Asynchronous sampling-0, Synchronous sampling-1',
    `pid`         INT(10) UNSIGNED NOT NULL COMMENT 'target vm correspond pid',
    `start_time`  TIMESTAMP        NOT NULL DEFAULT '1970-01-01 08:00:01' COMMENT 'Performance analysis start time',
    `update_time` TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'update time',
    `state`       INT(3) UNSIGNED  NOT NULL COMMENT 'Status, 0: Start 1: End 2: Ready 4: Error',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uniq_profiler_id` (`profiler_id`),
    INDEX idx_start_time (start_time),
    INDEX idx_app_code_agent_id (`app_code`, `agent_id`)
) CHARSET = utf8mb4;
