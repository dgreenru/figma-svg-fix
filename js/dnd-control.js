const DND_DATA_KEY = '[data-dnd]';

const SELECTOR_PAGE1 = '.page1';
const SELECTOR_PAGE2 = '.page2';
const SELECTOR_PAGE3 = '.page3';
const SELECTOR_CANCEL_BUTTON = '.cancel-button';
const SELECTOR_DOWNLOAD_BUTTON = '.download-button';

const DND_EVENT_TYPES = ['dragenter', 'dragover', 'dragleave', 'drop'];
const DND_EVENTS_TYPES_ENTER_OVER = ['dragenter', 'dragover'];
const DND_EVENTS_TYPES_LEAVE_DROP = ['dragleave', 'drop'];

class DNDControl {
    constructor(element, ) {
        this._element = element;
        this._page1 = element.querySelector(SELECTOR_PAGE1);
        this._page2 = element.querySelector(SELECTOR_PAGE2);
        this._page3 = element.querySelector(SELECTOR_PAGE3);
        this._cancelButton = element.querySelector(SELECTOR_CANCEL_BUTTON);
        this._downloadButton = element.querySelector(SELECTOR_DOWNLOAD_BUTTON);
        
        this._readers = [];
    }
    
    init() {
        DND_EVENT_TYPES.forEach(eventType => {
            this._element.addEventListener(eventType, this._preventDefault.bind(this), false);
        });
        
        DND_EVENTS_TYPES_ENTER_OVER.forEach(eventType => {
            this._element.addEventListener(eventType, this._highlight.bind(this), false);
        });
        
        DND_EVENTS_TYPES_LEAVE_DROP.forEach(eventType => {
            this._element.addEventListener(eventType, this._unhighlight.bind(this), false);
        });
        
        this._element.addEventListener('drop', this._handleDrop.bind(this), false);
        
        this._downloadButton.addEventListener('click', this._handleClickDownload, false);
        
        this._cancelButton.addEventListener('click', this._handleClickCancel, false)
    }
    
    _preventDefault(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    _highlight() {
        this._element.classList.add('highlight');
    }
    
    _unhighlight() {
        this._element.classList.remove('highlight');
    }
    
    _handleDrop(e) {
        const active = this._getActivePage();
        
        if (active === this._page1 || active === this._page3) {
            this._readers = [];
            this._setActivePage(this._page2);
            readFile([...e.dataTransfer.files], {
                onReady: (downloadFiles) => {
                    this._setActivePage(this._page3);
                    this._downloadFilesCallback = downloadFiles;
                    downloadFiles();
                },
                onReaderInited: (reader) => {
                    this._readers.push(reader);
                },
            });
            
            // Счетчик метрики
            ym(64664734,'reachGoal','convert-svg')
        }
    }
    
    _handleClickDownload = () => {
        this._downloadFilesCallback && (
            this._downloadFilesCallback()
        )
    };
    
    _handleClickCancel = () => {
        if (this._readers.length) {
            this._readers.forEach((reader) => {
                reader.abort();
            });
            
            for (let reader of this._readers) {
                if (!reader.result) {
                    this._setActivePage(this._page1);
                    break;
                }
            }
        }
    };
    
    _setActivePage(el) {
        this._clearActivePages();
        el.classList.add('active');
    }
    
    _getActivePage() {
        return [this._page1, this._page2, this._page3].find(page => {
            return page.classList.contains('active');
        });
    }
    
    _clearActivePages() {
        [this._page1, this._page2, this._page3].forEach(page => {
            page.classList.remove('active');
        });
    }
}

document.querySelectorAll(DND_DATA_KEY).forEach(el => {
    const dnd = new DNDControl(el);
    
    dnd.init();
});
