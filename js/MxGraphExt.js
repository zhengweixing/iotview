//扩展改造,动态加载自己的图形
// 郑伟星


var OpenDialog2 = function (Src) {
    var iframe = document.createElement('iframe');
    iframe.style.backgroundColor = 'transparent';
    iframe.allowTransparency = 'true';
    iframe.style.borderStyle = 'none';
    iframe.style.borderWidth = '0px';
    iframe.style.overflow = 'hidden';
    iframe.frameBorder = '0';
    iframe.setAttribute('width', '100%');
    iframe.setAttribute('height', '100%');
    iframe.setAttribute('src', Src);
    this.container = iframe;
};


// 扩展图库
var url = "shapes/mxGraph.json";

// 官方的没有加shape=
Sidebar.prototype.addImagePalette = function (id, title, prefix, postfix, items, titles, tags) {
    var fns = [];
    for (var i = 0; i < items.length; i++) {
        (mxUtils.bind(this, function (item, title, tmpTags) {
            if (tmpTags == null) {
                var slash = item.lastIndexOf('/');
                var dot = item.lastIndexOf('.');
                tmpTags = item.substring((slash >= 0) ? slash + 1 : 0, (dot >= 0) ? dot : item.length).replace(/[-_]/g, ' ');
            }
            fns.push(this.createVertexTemplateEntry(
                'shape=image;html=1;labelBackgroundColor=#ffffff;image=' + prefix + item + postfix,
                this.defaultImageWidth,
                this.defaultImageHeight,
                '',            // value
                title,         // title
                title != null, // showLabel
                null,          // showTitle
                this.filterTags(tmpTags)
            ));
        }))(items[i], (titles != null) ? titles[i] : null, (tags != null) ? tags[items[i]] : null);
    }
    this.addPaletteFunctions(id, title, false, fns);
};


// 扩展图形
Sidebar.prototype.addExtShapes = function () {
    var fns =[
        this.createEdgeTemplateEntry('shape=animLine;html=1;', 50, 50, '', 'animation Connector', null, 'animation directional'),
        this.createEdgeTemplateEntry('shape=animConnector;html=1;', 50, 50, '', 'animation Connector', null, 'animation directional'),
        this.createVertexTemplateEntry('shape=dateTimeText;html=1', 120, 60, '', 'dateTimer', null, null, 'datetimer'),
    ];
    this.addPaletteFunctions('extShapes', '扩展图形', false, fns);

    var style = 'html=1;image=lib/grapheditor/stencils/clipart/Gear_128x128.png;fontColor=none;align=center;fontStyle=1;labelPosition=center;verticalLabelPosition=bottom;verticalAlign=top;';
    var fns = [
        this.createVertexTemplateEntry('shape=timer;' + style, this.defaultImageWidth, this.defaultImageHeight, 'Timer', "Timer Adapter", true, null, null),
        this.createVertexTemplateEntry('shape=mqtt;' + style, this.defaultImageWidth, this.defaultImageHeight, 'MQTT', "MQTT Adapter", true, null, null),
        this.createVertexTemplateEntry('shape=http;' + style, this.defaultImageWidth, this.defaultImageHeight, 'HTTP', "HTTP Adapter", true, null, null)
    ];
    this.addPaletteFunctions('Adapter', '数据适配器', false, fns);
}

//扩展其它图形
Sidebar.prototype.addImageShapes = function () {
    var shapes = JSON.parse(mxUtils.load(url).request.responseText);
    function foreach(files) {
        var tags = [];
        var paths = [];
        var titles = [];
        for (i = 0; i < files.length; i++) {
            var File = files[i];
            paths.push(File.path);
            titles.push(File.title);
            tags[File.path] = File.title
        }
        return {
            paths: paths,
            tags: tags,
            titles: titles
        };
    }
    for (j = 0; j < shapes.length; j++) {
        var item = shapes[j];
        var title = item.title;
        var label = mxResources.get(title) ? mxResources.get(title) : title;
        var Files = foreach(item.files);
        this.addImagePalette(title, label, '', '', Files.paths, Files.titles, Files.tags);
    }
}

// echart图形
Sidebar.prototype.addEchartShapes = function () {
    var fns =[
        this.createVertexTemplateEntry('shape=echartBox;html=1;strokeColor=#c0c0c0;fillColor=#ffffff;overflow=fill;rounded=0;', 280, 160, 'EChart', 'EChart')
    ];
    this.addPaletteFunctions('echart', '图表', false, fns);
}

Sidebar.prototype.oldInit = Sidebar.prototype.init;
Sidebar.prototype.init = function () {
    this.oldInit();
    this.addExtShapes();
    this.addEchartShapes();
    this.addImageShapes();
}


// 动作扩展
Actions.prototype.oldInit = Actions.prototype.init;
Actions.prototype.init = function () {

    this.oldInit();

    var ui = this.editorUi;
    var editor = ui.editor;
    var graph = editor.graph;
    this.addAction('preview', function () {
        var view = mxUtils.getPrettyXml(editor.getGraphXml());
        graph.openLink('viewer.html?xml=' + Base64.encode(view));
    });

    this.put('about', new Action(mxResources.get('about'), function () {
        ui.showDialog(new OpenDialog2(RESOURCES_PATH + "/about_" + mxClient.language + ".html").container, 350, 300, true, true, function () {
        }, undefined, undefined, undefined, true);
    }));

    this.put('publish', new Action(mxResources.get('publish'), function () {
        console.log('publish');
        try{
            var view = mxUtils.getPrettyXml(editor.getGraphXml());
            window.parent.postMessage({ type : 'view', view : view }, "*");
        }catch(err){
            alert(err);
        }
    }));

};

// 菜单扩展
Menus.prototype.oldInit = Menus.prototype.init;
Menus.prototype.init = function () {
    this.oldInit();
    this.put('file', new Menu(mxUtils.bind(this, function (menu, parent) {
        this.addMenuItems(menu, ['preview', '-', 'publish', '-', 'import', 'export'], parent);
    })));
}


// 扩展format
TextFormatPanel.prototype.parentInit = TextFormatPanel.prototype.init
TextFormatPanel.prototype.init = function () {

    this.parentInit();
    var ui = this.editorUi;
    var editor = ui.editor;
    var graph = editor.graph;
    var container = this.container;

    var iframe = document.createElement('iframe');
    iframe.src = 'bind.html';
    iframe.style.borderWidth = '0px';
    iframe.scrolling = 'no';
    window.graph = graph;
    window.setData = function (cells) {
        console.log(cells);
    }
    window.onshow = function(){
        var height = iframe.contentWindow.document.documentElement.scrollHeight;
        iframe.height = height == 0 ? 1000 : height;
    }
    container.appendChild(iframe);
}

EditorUi.prototype.showImageDialog = function(title, value, fn, ignoreExisting)
{
    var cellEditor = this.editor.graph.cellEditor;
    var selState = cellEditor.saveSelection();

    var editor = this.editor;
    window.graph = editor.graph;
    var ui = this;
    window.openFile = new OpenFile(mxUtils.bind(this, function (newValue) {
        ui.hideDialog();
        cellEditor.restoreSelection(selState);
        if (newValue != null && newValue.length > 0) {
            var img = new Image();
            img.onload = function() {
                fn(newValue, img.width, img.height);
            };
            img.onerror = function(){
                fn(null);
                mxUtils.alert(mxResources.get('fileNotFound'));
            };
            img.src = newValue;
        } else {
            fn(null);
        }
    }));
    ui.showDialog(new OpenDialog2("images.html").container, 650, 500, true, true, function () {
        window.openFile = null;
        window.graph = null;
    }, undefined, undefined, undefined, true);
};


EditorUi.prototype.showBackgroundImageDialog = function(apply)
{
    apply = (apply != null) ? apply : mxUtils.bind(this, function(image) {
        console.log('showBackgroundImageDialog');
        var change = new ChangePageSetup(this, null, image);
        change.ignoreColor = true;
        this.editor.graph.model.execute(change);
    });
    var ui = this;
    window.openFile = new OpenFile(mxUtils.bind(this, function (newValue) {
        ui.hideDialog();
        if (newValue != null && newValue.length > 0) {
            var img = new Image();
            var editor = this.editor;
            img.onload = function() {
                console.log('set background image');
                var width = editor.graph.pageFormat.width;
                var height = editor.graph.pageFormat.height;
                apply(new mxImage(newValue, width, height));
            };
            img.onerror = function() {
                apply(null);
                mxUtils.alert(mxResources.get('fileNotFound'));
            };
            img.src = newValue;
        } else {
            apply(null);
        }
    }));
    ui.showDialog(new OpenDialog2("images.html").container, 650, 500, true, true, function () {
        window.openFile = null;
        window.graph = null;
    }, undefined, undefined, undefined, true);
};
