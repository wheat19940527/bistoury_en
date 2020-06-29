var REQ_TYPE_PROFILER = 51;
var REQ_TYPE_PROFILER_STOP = 52;
var REQ_TYPE_PROFILER_STATE_SEARCH = 53;
var globalProfilerId;
var searchStateIntervalId;

var curDuration;
var keepedTime = 0;
var startTime = null;
var processIntervalId;
var currentUiTime = null;

var READY_STATE = "ready";
var START_STATE = "start";
var STOP_STATE = "stop";

var async_sampler = "async_sampler";
var sampler = "sampler";

var async_sampler_code = "0";
var sampler_code = "1";

var globalProfilerState;

var currentHost = getCurrentHost();

function startProfiler() {
    var duration = $("#profiler-duration").val();
    console.log("start profiler.");
    if (duration > 3600) {
        bistoury.warning("Performance analysis time cannot exceed one hour");
        return;
    }
    if (duration < 30) {
        bistoury.warning("Performance analysis time cannot be less than 30 seconds");
        return;
    }
    initStartState();
    curDuration = duration;
    sendStartRequest(duration);
    $(".model-profiler-setting").modal("hide");
}

function openStartSettingModel() {
    var lastProfiler = searchLastProfiler();
    var lastProfileId = lastProfiler == null ? undefined : lastProfiler.profilerId;
    if (lastProfileId !== undefined && lastProfileId !== globalProfilerId) {
        bistoury.warning("The latest performance analysis record has been changed, please refresh the interface");
        return;
    }
    $(".model-profiler-setting").modal("show");
}

function initCurrentProfilerTable(profilerId) {
    globalProfilerId = profilerId;
    var reportUrl = "html/report.html?profilerId=" + profilerId;
    $("#btn_result").prop("href", reportUrl);
    startSearchStateInterval();
}

function searchLastProfiler() {
    var lastProfiler;
    $.ajax({
        "url": "profiler/last.do",
        "type": "get",
        "dataType": 'JSON',
        "data": {
            agentId: getAgentId(),
            appCode: getAppCode()
        },
        async: false,
        success: function (ret) {
            console.log(ret.data);
            if (ret.data != null) {
                lastProfiler = ret.data.info;
                startTime = lastProfiler.startTime;
                currentUiTime = ret.data.curTime;
            }
        }
    });
    return lastProfiler;
}

function searchProfilerHistory() {
    $.ajax({
        "url": "profiler/records.do",
        "type": "get",
        "dataType": 'JSON',
        "data": {
            appCode: getAppCode(),
            agentId: getAgentId()
        },
        async: false,
        success: function (ret) {
            if (ret.status === 0) {
                initHistoryTable(ret.data);
            }
        }
    });
}

function getMode(mode) {
    if (mode === async_sampler) {
        return "Asynchronous Sampling";
    } else if (mode === sampler) {
        return "Sampling";
    }
}

function initHistoryTable(data) {
    $("#history-body").empty();
    data.forEach(function (profiler) {
        var trElement = document.createElement('tr');
        var tdElement = document.createElement("td");
        if (profiler.state === STOP_STATE) {
            var reportElement = document.createElement("a");
            reportElement.text = profiler.startTime;
            var reportUrl = "html/report.html?profilerId=" + profiler.profilerId;
            reportElement.setAttribute("href", reportUrl);
            reportElement.setAttribute("target", "_blank");
            tdElement.appendChild(reportElement);
        } else {
            var errorText = document.createTextNode(profiler.startTime + "(Error end)")
            tdElement.appendChild(errorText);
        }
        trElement.appendChild(tdElement);

        var durationText = document.createTextNode(profiler.duration);
        var intervalText = document.createTextNode(profiler.interval);
        var modeText = document.createTextNode(getMode(profiler.mode));
        var durationElement = document.createElement("td");
        var modeElement = document.createElement("td");
        var intervalElement = document.createElement("td");
        modeElement.appendChild(modeText);
        durationElement.appendChild(durationText);
        intervalElement.appendChild(intervalText);

        trElement.appendChild(modeElement);
        trElement.appendChild(durationElement);
        trElement.appendChild(intervalElement);

        $("#history-body").append(trElement);
    });
}

function initNoStartState() {
    currentHost = getCurrentHost();

    var lastProfiler = searchLastProfiler();

    searchProfilerHistory();
    if (lastProfiler == null) {
        initState();
        return;
    }

    globalProfilerId = lastProfiler.profilerId;
    if (lastProfiler.state === START_STATE || lastProfiler.state === READY_STATE) {
        curDuration = lastProfiler.duration;
        globalProfilerState = START_STATE;
        startProcessStateInterval();
        initStartState();
        initCurrentProfilerTable(globalProfilerId);
        return;
    }
    globalProfilerState = STOP_STATE;
    initState();
}

function initState() {
    $('#btn_start_profiler').prop('disabled', false);
    $('#btn_stop_profiler').prop('disabled', true);
    $('#btn_result').addClass("disabled");
}

function initStartState() {
    $('#btn_start_profiler').prop('disabled', true);
    $('#btn_stop_profiler').prop('disabled', false);
    $('#btn_result').addClass("disabled");
}

function initEndState() {
    $('#btn_start_profiler').prop('disabled', false);
    $('#btn_stop_profiler').prop('disabled', true);
    $('#btn_result').removeClass("disabled");
}

function handleResult(content) {
    if (!content) {
        return;
    }
    var result = JSON.parse(content);
    if (!result) {
        return;
    }
    buildProfiler(result);
}

function buildProfiler(result) {
    var resType = result.type;
    var data = result.data;
    console.log("result: " + result);
    if (resType === "profilerstart") {
        if (data.code === 0) {
            globalProfilerState = READY_STATE;
            initCurrentProfilerTable(data.data.profilerId);
            bistoury.success("Start performance analysis");
            currentUiTime = null;
            startProcessStateInterval();
        } else {
            initState();
            bistoury.error("Add performance analysis failed, " + data.message)
        }
    } else if (resType === "profilerstop") {
        if (data.code === 0) {
            globalProfilerState = STOP_STATE;
        } else {
            bistoury.error("Stop performance analysis manually failed: " + data.message)
        }
    } else if (resType === "profilerstatesearch") {
        if (data.code === 0) {
            var status = data.data.status;
            if (status === "running") {
                globalProfilerState = START_STATE;
            } else if (status === "finish") {
                bistoury.success("Normal stop of performance analysis");
                stopSearchStateInterval();
                stopProcessStateWithFinish();
                initEndState();
                searchProfilerHistory();
                globalProfilerState = STOP_STATE;
            } else if (status === "error") {
                bistoury.success("End of performance analysis exception");
                stopSearchStateInterval();
                stopProcessStateInterval();
                initNoStartState();
                globalProfilerState = STOP_STATE;
            }
        }
    }
}

function getCurrentHost() {
    return $('#menu').treeview('getSelected')[0].value;
}

function getAppCode() {
    var currentHost = $('#menu').treeview('getSelected')[0].value;
    return currentHost.appCode;
}

function getAgentId() {
    var currentHost = $('#menu').treeview('getSelected')[0].value;
    return currentHost.ip;
}

function searchProfilerState() {
    sendStateCommand();
}

function sendStateCommand() {
    var command;
    if (globalProfilerState === READY_STATE) {
        command = "profilerstatesearch " + globalProfilerId + " profilerstartsearch";
    } else {
        command = "profilerstatesearch " + globalProfilerId + " profilerfinishsearch";
    }
    bistouryWS.sendCommand(currentHost, REQ_TYPE_PROFILER_STATE_SEARCH, command, stop, handleResult);
}

function sendStopCommand() {
    var currentHost = getCurrentHost();
    var command = "profilerstop " + globalProfilerId;
    bistouryWS.sendCommand(currentHost, REQ_TYPE_PROFILER_STOP, command, stop, handleResult);
}

function stopProfiler() {
    console.log("stop profiler.");
    sendStopCommand(globalProfilerId);
}

function sendStartRequest(duration) {
    var currentHost = $('#menu').treeview('getSelected')[0].value;
    var command = "profilerstart " + getAppCode();
    command += " " + duration;
    bistouryWS.sendCommand(currentHost, REQ_TYPE_PROFILER, command, stop, handleResult);
}


function changeProcessState() {
    var profiler_process = document.getElementById("cpu-profiler-process");
    keepedTime += 1;
    var percent = Math.ceil(keepedTime / curDuration * 100);
    percent = percent > 99 ? 99 : percent;
    profiler_process.style.width = percent + "%";
    profiler_process.innerHTML = profiler_process.style.width;
}

function stopSearchStateInterval() {
    if (searchStateIntervalId) {
        clearInterval(searchStateIntervalId);
    }
}

function startSearchStateInterval() {
    stopSearchStateInterval();
    searchStateIntervalId = setInterval(searchProfilerState, 3000);
}

function startProcessStateInterval() {
    stopProcessStateInterval();
    $("#profiler-process-div").css('display', 'block');
    if (currentUiTime === null) {
        keepedTime = 0;
    } else {
        var startMoment = moment(startTime, "yyyy-MM-dd HH:mm:ss");
        var curMoment = moment(currentUiTime, "yyyy-MM-dd HH:mm:ss");
        keepedTime = moment.duration(curMoment - startMoment).asSeconds();
    }
    processIntervalId = setInterval(changeProcessState, 1000);
}

function stopProcessStateInterval() {
    var profiler_process = document.getElementById("cpu-profiler-process");
    profiler_process.style.width = 0 + "%";
    profiler_process.innerHTML = profiler_process.style.width;
    $("#profiler-process-div").css('display', 'none');
    if (processIntervalId) {
        clearInterval(processIntervalId);
    }
}

function stopProcessStateWithFinish() {
    var profiler_process = document.getElementById("cpu-profiler-process");
    profiler_process.style.width = 100 + "%";
    profiler_process.innerHTML = profiler_process.style.width;
    if (processIntervalId) {
        clearInterval(processIntervalId);
    }
}

