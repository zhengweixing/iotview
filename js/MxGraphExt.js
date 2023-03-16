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

    var style = ';fontColor=none;align=center;fontStyle=1;labelPosition=center;verticalLabelPosition=bottom;verticalAlign=top;';
    var fns = [
        this.createVertexTemplateEntry('shape=timer;html=1;image=images/TIMER.png' + style, 35, 35, '', "Timer", true, null, null),
        this.createVertexTemplateEntry('shape=mqtt;html=1;image=images/MQTT.png' + style, 35, 35, '', "MQTT", true, null, null)
        // this.createVertexTemplateEntry('shape=http;html=1;image=images/HTTP.png' + style, 35, 35, '', "HTTP", true, null, null)
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
        // var view = mxUtils.getPrettyXml(editor.getGraphXml());
        // graph.openLink('viewer.html?xml=' + Base64.encode(view));
        try{
            var view = mxUtils.getPrettyXml(editor.getGraphXml());
            sendMessage({  event: 'preview', view : view })
        }catch(err){
            alert(err);
        }
    });

    this.addAction('export', function () {
        var view = mxUtils.getPrettyXml(editor.getGraphXml());
        graph.openLink('viewer.html?xml=' + Base64.encode(view));
    });

    this.put('about', new Action(mxResources.get('about'), function () {
        ui.showDialog(new OpenDialog2(RESOURCES_PATH + "/about_" + mxClient.language + ".html").container, 350, 300, true, true, function () {
        }, undefined, undefined, undefined, true);
    }));

    this.put('publish', new Action(mxResources.get('publish'), function () {
        try{
            var view = mxUtils.getPrettyXml(editor.getGraphXml());
            sendMessage({  event: 'publish', view : view })
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
        this.addMenuItems(menu, ['preview', '-', 'publish', '-', 'import', 'saveAs'], parent);
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

    var box = document.createElement('div');
    box.id = 'propBox';
    var prop = propRender.init(box, graph);

    var btnBox = document.createElement('div');
    btnBox.style = "text-align: center;padding:5px;";

    var title = mxResources.get('bind');
    title = title ? title : 'Bind';
    var bindBtn = mxUtils.button(title, mxUtils.bind(this, function(){
        sendMessage({ event : 'bind', callback: 'bind_data' })
    }));
    bindBtn.setAttribute('class', 'geBtn');
    bindBtn.style = "width:97%;display: block;margin:5px;";
    btnBox.appendChild(bindBtn);


    title = mxResources.get('advanced');
    title = title ? title : 'Advanced';
    var adBox = mxUtils.button(title, mxUtils.bind(this, function (evt) {
        window.graph = graph;
        window.cell = prop.cell;
        var state = graph.view.getState(prop.cell);
        window.shapeType = state.style.shape.toUpperCase();
        window.openFile = new OpenFile(mxUtils.bind(this, function () {
            ui.hideDialog();
        }));
        window.openFile.setConsumer(mxUtils.bind(this, function (cells) {
            console.log(cells);
        }));
        var href = "bind.html?type=" + window.shapeType;
        ui.showDialog(new OpenDialog2(href).container, 850, 478, true, true, function () {
            window.openFile = null;
            window.graph = null;
        }, undefined, undefined, undefined, true);
    }));
    adBox.setAttribute('class', 'geBtn');
    adBox.style = "width:97%;display: block;margin:5px;";
    btnBox.appendChild(adBox);

    var title = window.mxResources.get('apply');
    var subBtn = mxUtils.button(title, mxUtils.bind(this, function (evt) {
        prop.onSubmit();
    }));
    subBtn.style = "width:97%;display: block;margin:5px;";
    subBtn.setAttribute('class', 'geBtn gePrimaryBtn');
    btnBox.appendChild(subBtn);

    box.appendChild(btnBox);
    container.appendChild(box);
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
        var format = new mxRectangle(0, 0, image.width, image.height);
        var change = new ChangePageSetup(this, null, image, format);
        change.ignoreColor = true;
        this.editor.graph.model.execute(change);
    });
    var ui = this;
    window.openFile = new OpenFile(mxUtils.bind(this, function (newValue) {
        ui.hideDialog();
        if (newValue != null && newValue.length > 0) {
            var img = new Image();
            img.onload = function() {
                apply(new mxImage(newValue, img.width, img.height));
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
