$(document).ready(function () {
    var currentAppCode;

    function saveApp() {
        var app = {};
        app.id = $("#app-detail-id").val();
        app.code = $("#app-detail-code").val();
        app.name = $("#app-detail-name").val();
        app.groupCode = $("#app-detail-groupCode").val();
        app.owner = $("#app-detail-owner").val().replace(/ |\t/g, "").replace(/\n/g, ",");
        app.status = $("#app-detail-status").val();
        if (!app.code) {
            bistoury.error("Application code can not be null");
            return;
        }
        if (!app.name) {
            bistoury.error("Application name can not be null");
            return;
        }
        if (!app.groupCode) {
            bistoury.error("Group code can not be null");
            return;
        }
        if (!app.owner) {
            bistoury.error("Application owner can not be null");
            return;
        }
        if (!app.status) {
            bistoury.error("Status can not be null");
            return;
        }
        $.ajax({
            "url": "api/application/save.do",
            "type": "post",
            "dataType": 'JSON',
            "data": app,
            success: function (ret) {
                if (ret.status === 0) {
                    bistoury.success("Save success");
                    getAppList();
                    initPanel();
                } else {
                    console.log(ret.message);
                    bistoury.error(ret.message);
                }
            }
        })
    }

    function saveAppServer() {
        var appServer = {};
        appServer.serverId = $("#app-server-id").val();
        appServer.ip = $("#app-server-ip").val();
        appServer.port = $("#app-server-port").val();
        appServer.host = $("#app-server-host").val();
        appServer.logDir = $("#app-server-logDir").val();
        appServer.room = $("#app-server-room").val();
        appServer.appCode = currentAppCode;
        if (!appServer.ip) {
            bistoury.error("IP can't be null");
            return;
        }
        if (!appServer.host) {
            bistoury.error("Host can't be null");
            return;
        }

        if (!appServer.port) {
            bistoury.error("Port can't be null");
            return;
        }

        if (!appServer.logDir) {
            bistoury.error("Log dir can't be null");
            return;
        }
        if (!appServer.room) {
            bistoury.error("Server room can't be null");
            return;
        }

        $.ajax({
            "url": "api/app/server/save.do",
            "type": "post",
            "dataType": 'JSON',
            "data": appServer,
            success: function (ret) {
                if (ret.status === 0) {
                    bistoury.success("Save success");
                    $("#app-server-modal").modal('hide');
                    getAppServerListByAppCode();
                } else {
                    console.log(ret.message);
                    bistoury.error(ret.message);
                }
            }
        })
    }

    function getAppList() {
        $('#app-list-table').bootstrapTable('removeAll');
        $.ajax({
            "url": "api/application/list.do",
            "type": "get",
            success: function (ret) {
                if (ret.status === 0) {
                    $('#app-list-table').bootstrapTable('append', ret.data);
                } else {
                    console.log(ret.message)
                    bistoury.error("Get application list failed");
                }
            }
        })
    }

    function getAppServerListByAppCode() {
        $('#app-server-list-table').bootstrapTable('removeAll');
        $.ajax({
            "url": "api/app/server/list.do",
            "type": "get",
            "data": {
                appCode: currentAppCode
            },
            success: function (ret) {
                if (ret.status === 0) {
                    $('#app-server-list-table').bootstrapTable('append', ret.data);
                } else {
                    console.log(ret.message);
                    bistoury.error(ret.message);
                }
            }
        })
    }

    function getAppOwner(appCode) {
        $.ajax({
            "url": "api/application/owner.do",
            "type": "get",
            data: {
                appCode: appCode
            },
            success: function (ret) {
                if (ret.status === 0) {
                    $("#app-detail-owner").val(ret.data.join("\n"));
                } else {
                    console.log(ret.message);
                    bistoury.error("Get application owner failed");
                }
            }
        })
    }

    function changeAutoJMapHistoEnable(serverId, enable) {
        $.ajax({
            "url": "api/app/server/autoJMapHistoEnable.do",
            "type": "post",
            data: {
                serverId: serverId,
                enable: !enable
            },
            success: function (ret) {
                if (ret.status === 0) {
                    bistoury.success("Modify success");
                    getAppServerListByAppCode();
                } else {
                    console.log(ret.message);
                    bistoury.error("Auto modify JMap failed");
                }
            }
        })
    }

    function changeAutoJStackEnable(serverId, enable) {
        $.ajax({
            "url": "api/app/server/autoJStackEnable.do",
            "type": "post",
            data: {
                serverId: serverId,
                enable: !enable
            },
            success: function (ret) {
                if (ret.status === 0) {
                    bistoury.success("修改成功");
                    getAppServerListByAppCode();
                } else {
                    console.log(ret.message);
                    bistoury.error("Auto modify JMap failed");
                }
            }
        })
    }

    function deleteAppServerByServerId(serverId) {
        if (!confirm("Are you sure delete?")) {
            return;
        }
        $.ajax({
            "url": "api/app/server/delete.do",
            "type": "post",
            data: {
                serverId: serverId
            },
            success: function (ret) {
                if (ret.status === 0) {
                    bistoury.success("Delete success");
                    getAppServerListByAppCode();
                } else {
                    console.log(ret.message);
                    bistoury.error("Delete failed");
                }
            }
        })
    }

    function buildAppDetail(app) {
        $("input[data-role='app-detail-value']").val("");
        $("textarea[data-role='app-detail-value']").val("");
        $("#app-detail-id").val(app.id);
        $("#app-detail-code").val(app.code);
        $("#app-detail-name").val(app.name);
        $("#app-detail-groupCode").val(app.groupCode);
        $("#app-detail-status").val(app.status);
        getAppOwner(app.code);

    }

    function buildAppServerManage(appServer) {
        $("input[data-role='app-server-value']").val("");
        $("#app-server-id").val(appServer.serverId);
        $("#app-server-ip").val(appServer.ip);
        $("#app-server-port").val(appServer.port);
        $("#app-server-host").val(appServer.host);
        $("#app-server-logDir").val(appServer.logDir);
        $("#app-server-room").val(appServer.room);
    }

    function initAppListTable() {
        $('#app-list-table').bootstrapTable({
            data: [{}],
            striped: true, //是否显示行间隔色
            pageNumber: 1, //初始化加载第一页
            pagination: true,//是否分页
            sidePagination: 'client',//server:服务器端分页|client：前端分页
            pageSize: 10,//单页记录数
            pageList: [10, 20, 50, 100],//可选择单页记录数
            showRefresh: true,//刷新按钮
            search: true,
            toolbar: "#app-list-toolbar",
            searchAlign: "left",
            buttonsAlign: "left",
            columns: [{
                title: 'Code',
                field: 'code',
                sortable: true,
                searchable: true,
            }, {
                title: 'Name',
                field: 'name',
                sortable: true,
                searchable: true
            }, {
                title: 'Group Code',
                field: 'groupCode',
                sortable: true,
                searchable: true

            }, {
                title: 'Status',
                field: 'status',
                sortable: true,
                searchable: false,
                formatter: function (value, row, index) {
                    if (value == 0) {
                        return "<span class='status-unaudit'>Unaudit</span>"
                    } else if (value == 1) {
                        return "<span class='status-pass'>Pass</span>";
                    } else if (value == 2) {
                        return "<span class='status-reject'>Reject</span>";
                    } else if (value == 3) {
                        return "<span class='status-discard'>Discard</span>";
                    } else {
                        return value;
                    }
                }
            }, {
                title: 'Creator',
                field: 'creator',
                sortable: true,
                searchable: true
            }, {
                title: 'Create Time',
                field: 'createTime',
                sortable: true,
                searchable: false,
                formatter: function (value) {
                    return dateFormat(value);
                }
            }, {
                title: 'Operate',
                field: 'operate',
                events: operateEvents,
                formatter: function (value, row, index) {
                    return [
                        '<a class="btn btn-info btn-sm app-manage" href="#">Manage</a>'
                    ].join('');
                }
            }],
            onRefresh: function () {
                getAppList();
            }
        });
    }


    function initAppServerTable() {
        $('#app-server-list-table').bootstrapTable({
            data: [{}],
            striped: true, //是否显示行间隔色
            pageNumber: 1, //初始化加载第一页
            pagination: true,//是否分页
            sidePagination: 'client',//server:服务器端分页|client：前端分页
            pageSize: 10,//单页记录数
            pageList: [10, 20, 50, 100],//可选择单页记录数
            showRefresh: true,//刷新按钮
            search: true,
            toolbar: '#app-server-toolbar',
            searchAlign: "left",
            buttonsAlign: "left",
            columns: [{
                title: 'Server Room',
                field: 'room',
                sortable: true,
                searchable: false,
            }, {
                title: 'Host',
                field: 'host',
                sortable: true,
                searchable: true
            }, {
                title: 'IP',
                field: 'ip',
                sortable: true,
                searchable: true
            }, {
                title: 'Port',
                field: 'port',
                sortable: true,
                searchable: false

            }, {
                title: 'Log Dir',
                field: 'logDir',
                sortable: true,
                searchable: false
            }, {
                title: 'CPU monitoring',
                field: 'autoJStackEnable',
                sortable: true,
                searchable: true,
                events: operateEvents,
                formatter: function (value, row, index) {
                    if (value) {
                        return '<input type="checkbox" class="auto-enable autoJStackEnable" id="autoJStackEnable-' + index + '" name="autoJStackEnable" checked><label for="autoJStackEnable-' + index + '"></label>'
                    } else {
                        return '<input type="checkbox" class="auto-enable autoJStackEnable" id="autoJStackEnable-' + index + '" name="autoJStackEnable"><label for="autoJStackEnable-' + index + '"></label>'
                    }
                }
            }, /*{
                title: '堆对象概览监控',
                field: 'autoJMapHistoEnable',
                sortable: true,
                searchable: true,
                events: operateEvents,
                formatter: function (value, row, index) {
                    if (value) {
                        return '<input type="checkbox" class="auto-enable autoJMapHistoEnable" id="autoJMapHistoEnable-' + index + '" name="autoJMapHistoEnable" checked><label for="autoJMapHistoEnable-' + index + '"></label>'
                    } else {
                        return '<input type="checkbox" class="auto-enable autoJMapHistoEnable" id="autoJMapHistoEnable-' + index + '" name="autoJMapHistoEnable"><label for="autoJMapHistoEnable-' + index + '"></label>'
                    }
                }
            },*/ {
                title: 'Operate',
                field: 'operate',
                events: operateEvents,
                formatter: function (value, row, index) {
                    return [
                        '<a class="btn btn-info btn-sm app-server-manage" href="#">Manage</a>',
                        '<a class="btn btn-info btn-sm app-server-delete" href="#">Delete</a>'
                    ].join(' ');
                }
            }],
            onRefresh: function () {
                getAppServerListByAppCode();
            }
        });
    }

    $("#app-detail-save").click(function () {
        saveApp();
    });

    $("#app-server-save-btn").click(function () {
        saveAppServer();
    });

    $("#app-server-add-btn").click(function () {
        $("input[data-role='app-server-value']").val("");
        $("#app-server-modal").modal('show');
    })

    $("#app-add-btn").click(function () {
        currentAppCode = "";
        $("input[data-role='app-detail-value']").val("");
        $("textarea[data-role='app-detail-value']").val("");
        $("#app-detail-id").val(-1);
        $("#app-detail-code").removeAttr("disabled");
        initAppDetailPanel()
    });

    $("#app-server-list-tab").click(function (e) {
        if (currentAppCode) {
            getAppServerListByAppCode();
        } else {
            bistoury.warning("Please save the app first");
            e.stopPropagation();
        }
    });
    $(".back-app-list").click(function () {
        initPanel();
        getAppList();
    });
    window.operateEvents = {
        "click .app-manage": function (e, value, row, index) {
            currentAppCode = row.code;
            $("#app-detail-tail-app-code").text(currentAppCode);
            $("#app-detail-code").attr("disabled");
            initAppDetailPanel();
            buildAppDetail(row);
        },
        "click .app-server-delete": function (e, value, row, index) {
            deleteAppServerByServerId(row.serverId);
        },
        "click .app-server-manage": function (e, value, row, index) {
            $("#app-server-modal").modal('show');
            buildAppServerManage(row);
        },
        "change .autoJStackEnable": function (e, value, row, index) {
            if (value) {
                changeAutoJStackEnable(row.serverId, value);
            } else if (confirm("Bistoury will monitor the thread level CPU every minute")) {
                changeAutoJStackEnable(row.serverId, value);
            } else {
                e.currentTarget.checked = value
            }
        },
        "change .autoJMapHistoEnable": function (e, value, row, index) {
            if (value) {
                changeAutoJMapHistoEnable(row.serverId, value)
            } else if (confirm("Bistoury will monitor the heap object overview every minute and perform jmap - histo operation")) {
                changeAutoJMapHistoEnable(row.serverId, value)
            } else {
                e.currentTarget.checked = value
            }
        }
    }

    function initAppDetailPanel() {
        $("#app-list-panel").hide();
        $("#app-detail-panel").show();
        $("#app-server-list").removeClass("active");
        $("#app-detail").addClass("active");
        $("#app-detail-tab").attr("aria-expanded", true);
        $("#app-server-list-tab").attr("aria-expanded", false);
        $("#app-detail-tab").parent().addClass("active");
        $("#app-server-list-tab").parent().removeClass("active");
    }

    function dateFormat(dateStr) {
        var date = new Date(dateStr)
        var year = date.getFullYear();
        var month = ("0" + (date.getMonth() + 1)).slice(-2);
        var day = ("0" + date.getDate()).slice(-2);
        var h = ("0" + date.getHours()).slice(-2);
        var m = ("0" + date.getMinutes()).slice(-2);
        var s = ("0" + date.getSeconds()).slice(-2);
        return year + "-" + month + "-" + day + " " + h + ":" + m + ":" + s;
    }

    function initPanel() {
        currentAppCode = "";
        $("#app-list-panel").show();
        $("#app-detail-panel").hide();
    }

    function init() {
        initPanel();
        initAppListTable();
        initAppServerTable();
        getAppList();
    }

    init();
})