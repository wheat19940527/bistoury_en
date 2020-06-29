#!/bin/bash

BISTOURY_BASE_DIR=`pwd`

H2_DATABASE_DIR="$BISTOURY_BASE_DIR/h2"

APP_LOG_DIR="$BISTOURY_BASE_DIR/log"

BISTOURY_UI_DIR="$BISTOURY_BASE_DIR/bistoury-ui"
BISTOURY_UI_BIN_DIR="$BISTOURY_UI_DIR/bin"

BISTOURY_PROXY_DIR="$BISTOURY_BASE_DIR/bistoury-proxy"
BISTOURY_PROXY_BIN_DIR="$BISTOURY_PROXY_DIR/bin"

BISTOURY_AGENT_DIR="$BISTOURY_BASE_DIR/bistoury-agent"
BISTOURY_AGENT_BIN_DIR="$BISTOURY_AGENT_DIR/bin"
BISTOURY_AGENT_APP_LIB_CLASS="";

BISTOURY_TMP_DIR="$BISTOURY_BASE_DIR/tmp/bistoury"
BISTOURY_PROXY_CONF_FILE="$BISTOURY_TMP_DIR/proxy.conf"

LOCAL_IP=`/sbin/ifconfig -a|grep inet|grep -v 127.0.0.1|grep -v inet6|awk '{print $2}'|tr -d "addr:"|tail -1`

start(){

    cd $H2_DATABASE_DIR
    ./h2.sh -j $2 -i $LOCAL_IP -l $APP_LOG_DIR start
    sleep 5

    cd $BISTOURY_PROXY_BIN_DIR
    ./bistoury-proxy.sh -j $2 -i $LOCAL_IP start
    #等待proxy启动
    sleep 5

    cd $BISTOURY_AGENT_BIN_DIR
    if [[ -n $BISTOURY_AGENT_APP_LIB_CLASS ]]; then
        ./bistoury-agent.sh -p $1 -i $LOCAL_IP -j $2 -c "$BISTOURY_AGENT_APP_LIB_CLASS" start
    else
        ./bistoury-agent.sh -p $1 -i $LOCAL_IP -j $2 start
    fi

    cd $BISTOURY_UI_BIN_DIR
    ./bistoury-ui.sh -j $2 -i $LOCAL_IP start

    cd $BISTOURY_BASE_DIR
}

stop(){

    cd $BISTOURY_UI_BIN_DIR
    ./bistoury-ui.sh stop

    cd $BISTOURY_AGENT_BIN_DIR
    ./bistoury-agent.sh stop

    cd $BISTOURY_PROXY_BIN_DIR
    ./bistoury-proxy.sh stop

    cd $H2_DATABASE_DIR
    ./h2.sh stop

    cd $BISTOURY_BASE_DIR
}

for CMD in "$@";do true; done

while getopts p:i:j:l:c:h opt;do
    case $opt in
        p) APP_PID=$OPTARG;;
        i) LOCAL_IP=$OPTARG;;
        j) JAVA_HOME=$OPTARG;;
        l) APP_LOG_DIR=$OPTARG;;
        c) BISTOURY_AGENT_APP_LIB_CLASS=$OPTARG;;
        h|*) echo "-p    Specify the application process PID"
           echo "-i    Specify the host ip"
           echo "-j    Specify java home"
           echo "-l    Specify application log dir, default /tmp"
           echo "-c    Specify a class in the jar package that the application depends on through - C "
           echo "-h    Help"
           exit 0
    esac
done

if [[ ! -w "$BISTOURY_TMP_DIR" ]] ; then
    mkdir -p "$BISTOURY_TMP_DIR"
fi

if [[ "start" == $CMD ]] && [[ ! -n $JAVA_HOME ]]; then
    echo "Setting JAVA_HOME or -j to specify JAVA_HOME"
    exit 0;
fi

if [[ "start" == $CMD ]] && [[ ! -n $BISTOURY_AGENT_APP_LIB_CLASS ]]; then
    echo "no setting -c option, agent will through org.springframework.web.servlet.DispatcherServlet to get jar classpath"
fi

if [[ "start" == $CMD ]] && [[ -n "$APP_PID" &&  -n "$JAVA_HOME" ]]; then
    PROXY_TOMCAT_PORT=9090
    PROXY_WEBSOCKET_PORT=9881;

    echo "$LOCAL_IP:$PROXY_TOMCAT_PORT:$PROXY_WEBSOCKET_PORT">$BISTOURY_PROXY_CONF_FILE
    start $APP_PID $JAVA_HOME $BISTOURY_AGENT_APP_LIB_CLASS $LOCAL_IP
elif [[ "stop" == $CMD ]]; then
    stop
    rm -rf $BISTOURY_PROXY_CONF_FILE
else
    echo "command format wrong, Usage: [$0 -p pid -j java_home start] or [$0 stop]"
    exit 0
fi