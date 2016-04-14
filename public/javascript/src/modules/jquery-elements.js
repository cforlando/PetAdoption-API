define(['jquery'], function($){
    var $window = $(window),
        $html = $('html'),
        $scrollWindow = $('html, body'),
        $body = $html.find('body'),
        $header = $body.find('header'),
        $footer = $body.find('footer'),
        $wpMeta = $body.find('#wp-meta');
    return {
        body : $body,
        $body : $body,
        footer : $footer,
        $footer : $footer,
        header : $header,
        $header : $header,
        html : $html,
        $html : $html,
        window : $window,
        $window : $window,
        wpMeta : $wpMeta,
        $wpMeta : $wpMeta,
        scrollWindow : $scrollWindow,
        $scrollWindow : $scrollWindow
    };
});
