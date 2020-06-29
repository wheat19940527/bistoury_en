/**
 * Bootstrap Table Chinese translation
 * Author: Zhixin Wen<wenzhixin2010@gmail.com>
 */
(function ($) {
    'use strict';

    $.fn.bootstrapTable.locales['zh-CN'] = {
        formatLoadingMessage: function () {
            return 'Loading';
        },
        formatRecordsPerPage: function (pageNumber) {
            return 'Per page ' + pageNumber + ' records';
        },
        formatShowingRows: function (pageFrom, pageTo, totalRows) {
            return 'show from' + pageFrom + ' to ' + pageTo + ' records, total ' + totalRows + ' records';
        },
        formatSearch: function () {
            return 'Search';
        },
        formatNoMatches: function () {
            return 'No matching records found';
        },
        formatPaginationSwitch: function () {
            return 'Hide/Show pagination';
        },
        formatRefresh: function () {
            return 'Refresh';
        },
        formatToggle: function () {
            return 'Toggle';
        },
        formatColumns: function () {
            return 'Column';
        },
        formatExport: function () {
            return 'Export data';
        },
        formatClearFilters: function () {
            return 'Clear Filter';
        }
    };

    $.extend($.fn.bootstrapTable.defaults, $.fn.bootstrapTable.locales['zh-CN']);

})(jQuery);
