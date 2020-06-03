function forEach(obj, callback) {
    let length, i = 0;
    
    if (Array.isArray(obj)) {
        length = obj.length;
        for (; i < length; i++) {
            if (callback.call(obj[i], i, obj[i]) === false) {
                break;
            }
        }
    } else {
        for (i in obj) {
            if (callback.call(obj[i], i, obj[i]) === false) {
                break;
            }
        }
        
        return obj;
    }
}

function download(data, filename, type) {
    let file = new Blob([data], {type: type});
    if (window.navigator.msSaveOrOpenBlob) // IE10+
        window.navigator.msSaveOrOpenBlob(file, filename);
    else { // Others
        let a = document.createElement("a"),
            url = URL.createObjectURL(file);
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(function () {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 0);
    }
}

function formatXml(xml) {
    let formatted = '';
    const reg = /(>)(<)(\/*)/g;
    xml = xml.replace(reg, '$1\r\n$2$3');
    let pad = 0;
    forEach(xml.split('\r\n'), function (index, node) {
        let indent = 0;
        if (node.match(/.+<\/\w[^>]*>$/)) {
            indent = 0;
        } else if (node.match(/^<\/\w/)) {
            if (pad != 0) {
                pad -= 1;
            }
        } else if (node.match(/^<\w[^>]*[^\/]>.*$/)) {
            indent = 1;
        } else {
            indent = 0;
        }
        
        let padding = '';
        for (var i = 0; i < pad; i++) {
            padding += '  ';
        }
        
        formatted += padding + node + '\r\n';
        pad += indent;
    });
    
    return formatted;
}

//sed 's/viewBox="\([0-9]*\) \([0-9]*\) \([0-9]*\) \([0-9]*\)"/width="\3px" height="\4px"/g'
const replace = [
    [/ width="100%"/g, ''],
    [/ height="100%"/g, ''],
    [/<clipPath/g, '<mask fill="white"'],
    [/clipPath/g, 'mask'],
    [/clip-path/g, 'mask'],
    [/viewBox="\([0-9]*\) \([0-9]*\) \([0-9]*\) \([0-9]*\)"/g, 'width="\3px" height="\4px"']
];

function readFile(files, {onReady}) {
    let zip = new JSZip();
    for (let f = 0; f < files.length; f++) {
        let file = files[f];
        let reader = new FileReader();
        
        reader.readAsText(file);
        
        reader.onload = function () {
            let stack = [];
            let xml = formatXml(reader.result);
            let lines = xml.split("\n");
            for (let i = 0; i < lines.length; i++) {
                for (let p = 0; p < replace.length; p++) {
                    lines[i] = lines[i].replace(replace[p][0], replace[p][1]);
                }
                lines[i] = wrapMask(stack, lines[i]);
            }
            zip.file(file.name, lines.join('\n'));
            if(f == files.length - 1) {
                zip.generateAsync({type:"blob"})
                   .then(function(content) {
                       onReady(() => {
                           download(content, "figma-fixed." + new Date().toISOString() + ".zip", "application/zip");
                       })
                   });
            }
        }
        reader.onerror = function () {
            alert(reader.error);
        };
    }
}

function wrapMask(stack, line) {
    if (line.match(/mask fill/)) {
        stack.push(line.indexOf("<"));
        return '<g>' + line;
    } else if (stack.length > 0 && line.match(/<\/g>/) && line.indexOf("<") == stack[stack.length - 1]) {
        stack.pop();
        return '</g>' + line;
    } else {
        return line;
    }
}
