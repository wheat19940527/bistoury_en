#!/bin/bash
set -euo pipefail

BISTOURY_BIN="${BASH_SOURCE-$0}" # 获取当前执行的脚本文件的全路径
BISTOURY_BIN="$(dirname "$BISTOURY_BIN")"
BISTOURY_BIN_DIR="$(cd "$BISTOURY_BIN"; pwd)"
BISTOURY_MAIN="qunar.tc.bistoury.indpendent.agent.Main"

ARTHAS_INPUT_RC_DIR=$BISTOURY_BIN"/arthas/conf"
ARTHAS_INPUT_RC_PATH=$ARTHAS_INPUT_RC_DIR"/inputrc";

. "$BISTOURY_BIN_DIR/base.sh"
. "$BISTOURY_BIN_DIR/bistoury-agent-env.sh"

for CMD in "$@";do true; done

APP_PID=""
LOCAL_IP=""

while getopts p:i:j:c:h opt;do
    case $opt in
        p) APP_PID=$OPTARG;;
        i) LOCAL_IP=$OPTARG;;
        j) JAVA_HOME=$OPTARG;;
        c) BISTOURY_APP_LIB_CLASS=$OPTARG;;
        h|*) echo "-p    Specify application process pid"
           echo "-i    Specify host IP"
           echo "-j    Specify JAVA_HOME"
           echo "-c    Specify a class in the jar package that the application depends on through - C (It is recommended to use the jar package of the company's internal middleware or the classes in the spring related packages, such as org.springframework.web.servlet.DispatcherServlet), agent will get the jar classpath of the application."
           echo "-h    Help"
           exit 0
    esac
done

if [[ "$JAVA_HOME" != "" ]];then
    JAVA="$JAVA_HOME/bin/java"
else
    JAVA=java;
fi

if [[ ! -w "$ARTHAS_INPUT_RC_DIR" ]] ; then
  mkdir -p "$ARTHAS_INPUT_RC_DIR"
fi

if [ ! -f "$ARTHAS_INPUT_RC_PATH" ];then
  cp "$BISTOURY_BIN_DIR"/inputrc "$ARTHAS_INPUT_RC_PATH"
fi


if [[ ! -n $BISTOURY_APP_LIB_CLASS ]]; then
    echo "Specify a class in the jar package that the application depends on through - C (It is recommended to use the jar package of the company's internal middleware or the classes in the spring related packages, such as org.springframework.web.servlet.DispatcherServlet), agent will get the jar classpath of the application."
    exit 0
fi

if [[ -n $LOCAL_IP ]]; then
    JAVA_OPTS="$JAVA_OPTS -Dbistoury.local.host=$LOCAL_IP"
fi

if [[ -n $APP_PID ]]; then
    JAVA_OPTS="$JAVA_OPTS -Dbistoury.user.pid=$APP_PID"
fi

JAVA_OPTS="$JAVA_OPTS -Dbistoury.app.lib.class=$BISTOURY_APP_LIB_CLASS -Dbistoury.log.dir=$BISTOURY_LOG_DIR -Xmx80m -Xmn50m -XX:+UseParallelGC -XX:+UseParallelOldGC -XX:+UseCodeCacheFlushing -Xloggc:${BISTOURY_LOG_DIR}/bistoury-gc-${TIMESTAMP}.log -XX:+PrintGC -XX:+PrintGCDetails -XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=${BISTOURY_LOG_DIR}"
BISTOURY_PID_FILE="$BISTOURY_PID_DIR/bistoury-agent.pid"
BISTOURY_DAEMON_OUT="$BISTOURY_LOG_DIR/bistoury-agent.out"

resetEvn(){
    local JAVA_VERSION=""
    local IFS=$'\n'
    local tempClassPath=""
    local lines=$("${JAVA_HOME}"/bin/java -version 2>&1 | tr '\r' '\n')
    for line in $lines; do
      if [[ (-z $JAVA_VERSION) && ($line = *"version"*) ]]
      then
        local ver=$(echo $line | sed -e 's/.*version "\(.*\)"\(.*\)/\1/; 1q')
        # on macOS, sed doesn't support '?'
        if [[ $ver = "1."* ]]
        then
          JAVA_VERSION=$(echo $ver | sed -e 's/1\.\([0-9]*\)\(.*\)/\1/; 1q')
        else
          JAVA_VERSION=$(echo $ver | sed -e 's/\([0-9]*\)\(.*\)/\1/; 1q')
        fi
      fi
    done

    # when java version less than 9, we can use tools.jar to confirm java home.
    # when java version greater than 9, there is no tools.jar.
    if [[ "$JAVA_VERSION" -lt 9 ]];then
      # possible java homes
      javaHomes=("${JAVA_HOME%%/}" "${JAVA_HOME%%/}/.." "${JAVA_HOME%%/}/../..")
      for javaHome in ${javaHomes[@]}
      do
          toolsJar="$javaHome/lib/tools.jar"
          saJdiJar="$JAVA_HOME/lib/sa-jdi.jar"
          if [ -f $toolsJar ] && [ -f $saJdiJar ]; then
            tempClassPath="$toolsJar:$saJdiJar"
          fi
      done

      if [ -z $tempClassPath ]; then
          echo "tools.jar and sa-jdi.jar was not found, so bistoury agent could not be launched!"
          exit 0;
      else
        CLASSPATH="$CLASSPATH:$tempClassPath"
      fi
    else
        JAVA_OPTS="$JAVA_OPTS --add-opens=java.base/jdk.internal.perf=ALL-UNNAMED"
    fi

    echo "JAVA_HOME: $JAVA_HOME"
}

start(){
    echo "Start bistoury agent ..."

    resetEvn

    nohup "$JAVA" -cp "$CLASSPATH" ${JAVA_OPTS} ${BISTOURY_MAIN} > "$BISTOURY_DAEMON_OUT" 2>&1 < /dev/null &
    if [[ $? -eq 0 ]]
    then
      /bin/echo -n $! > "$BISTOURY_PID_FILE"
      if [[ $? -eq 0 ]];
      then
        sleep 1
        echo STARTED
      else
        echo FAILED TO WRITE PID
        exit 1
      fi
    else
      echo SERVER DID NOT START
      exit 1
    fi
}
stop(){
    echo "Stopping bistoury agent ... "
    if [[ ! -f "$BISTOURY_PID_FILE" ]]
    then
      echo "no bistoury agent to stop (could not find file $BISTOURY_PID_FILE)"
    else
      kill $(cat "$BISTOURY_PID_FILE")
      rm "$BISTOURY_PID_FILE"
      echo "STOPPED"
    fi
}

case ${CMD} in
start)
    start
    ;;
stop)
    stop
    exit 0
    ;;
restart)
    stop
    start
    ;;
*)
    echo "Usage: $0 {start|restart|stop}" >&2
esac

