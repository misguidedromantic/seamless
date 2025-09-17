const gRatio = 1.618

window.onload = async function(){
    displayManager.createSelectors()
    //displayManager.positionSelectors()
    //displayManager.loadSelector('smeSelector')
    runTestSuite()
}

function runTestSuite(){

    const printResults = function(allResults){
        allResults.forEach(result => result.print())
    }

    const elementsCorrectlyCreated = function(checkElements){
        const results = []

        const idFound = function(domElem){
            return domElem !== null
        }

        const typeMatch = function(domElem, checkElem){
            try{return domElem.tagName === checkElem.tagName}
            catch{return false}
        }

        const calculateResult = function(checkElem, domElem){
            let result = 'fail'
            let reason = ''

            if(!idFound(domElem)){
                reason = ' (not found)'
            } else if (!typeMatch(domElem, checkElem)){
                reason = ' (found as: ' + domElem.tagName + ')'
            }

            if(idFound(domElem, checkElem) && typeMatch(domElem, checkElem)){
                result = 'pass'
            }

            return result + reason
        }

        checkElements.forEach(checkElem => {
            const domElem = document.getElementById(checkElem.id)
            const resultDescription = checkElem.id + ' created correctly'
            results.push(new testResult(resultDescription, calculateResult(checkElem, domElem)))
        })
        
        return results
    }

    const checkElements = [
        new checkElement('smeSelectorDiv','div'),
        new checkElement('smeSelectorSvg','svg'),
        new checkElement('smeActivityDiv','div'),
        new checkElement('smeActivitySvg','svg')
    ]
    
    const testResults = elementsCorrectlyCreated(checkElements)
    printResults(testResults)
}

class testResult {
    constructor(description, result){
        this.description = description
        this.result = result
    }

    print(){
        const message = this.description + ': ' + this.result
        console.log(message)
    }
}

class checkElement {
    constructor (id, tagName){
       this.id = id
       this.tagName = tagName.toUpperCase()
    }
}

class displayManager {

    static createSelectors(){
        displays.smeSelector = new display ('smeSelector')
        //displays.smeSelector = new smeSelector ()
        //displays.activitySelector = new activitySelector ()
    }

    static async positionSelectors(){
        await displays.smeSelector.setPosition()
        await displays.activitySelector.setPosition(displays.smeSelector, 400)
        //displayManager.repositionSelector('activitySelectorDiv')
    }

    static async repositionSelector(displayName){
        const thisDiv = d3.selectAll('div').select('#activitySelectorDiv')
        console.log(thisDiv) 
        const div = await displays.getDiv(displayName)
        
        div.call(this.move, div, 500, 200, 400)
    }
    
    static move(selection, duration, left, top){
        console.log(selection)
        selection
            .transition('t333')
            .duration(duration)
            .ease(d3.easeCubicInOut)
            .style('left', left + 'px')
            .style('top', top + 'px')

    }

    static loadSelector(selectorName){
        displays[selectorName].load()
    }

    static getDisplay(displayTitle){
        return displays[displayTitle]
    }


}

class display {

    constructor(id){
        this.id = id
        this.createContainer()
        this.createCanvas()
    }

    createContainer(){
        this.div = d3.select('body')
            .append('div').attr('id', this.id + 'Div')
            .style('position', 'absolute')
    }

    createCanvas(){
        this.svg = this.div.append('div')
            .attr('id', this.id + 'Svg')
    }

    reposition(){

    }

    resize(){}

    updateContent(){

    }

}

class containerDynamics {
    
}


function onItemHover(){
    const targetElem = d3.select(this)
    const id = targetElem.attr('id')
    targetElem.attr('font-weight','bold')
    allOtherElements = d3.selectAll('g').filter(d => d.id !== id)
    allOtherElements.attr('font-weight','normal')
}

function onItemOff(event, d){
    const elem = d3.select('#' + d.id)
    elem.attr('font-weight','normal')    
}

function onItemClick(){
    const targetElem = d3.select(this)
    
    const classes = targetElem.attr('class').split(' ')
    const displayTitle = classes[0]
    thisDisplay = displayManager.getDisplay(displayTitle)
    thisDisplay.itemClicked(targetElem.data()[0])
}

class selectionManager {
    
    static subscribers = {}
    static subscribe(selectionEvent, callback){
        if (!this.subscribers[selectionEvent]) {
            this.subscribers[selectionEvent] = [];
        }
        this.subscribers[selectionEvent].push(callback);
    
    }

    static publish(selectionEvent, data){
        if (this.subscribers[selectionEvent]) {
            this.subscribers[selectionEvent].forEach(callback => {
                callback(data);
            });
        }
    }
}

class selector {

    items = []
    dynamics = {}

    constructor(title){
        this.title = title
        this.setupWindow()
    }

    createItems(data){
        this.items.push(new menuItem ('title', this.title, this.title))
        data.forEach(d => {
            this.items.push(new menuItem ('selectable', d))
        });
    }

    unload(){
        this.items = []
    }

    itemClicked(clickedItem){
        switch(clickedItem.type){
            case 'selectable':
                this.updateSelection(clickedItem)
                break;
            case 'title':
                this.dynamics.expand(this.items)
            default:
        }
    }

    updateSelection(clickedItem){
         if(clickedItem.selected){
            clickedItem.selected = false
         } else {
            clickedItem.selected = true 
            this.deselectOtherItems(clickedItem.id)
            this.dynamics.contract(this.items)
         }

         selectionManager.publish(this.constructor.name, clickedItem)
    }

    deselectOtherItems(selectedID){
        const remainingItems = this.items.filter(item => {item.type === 'selectable', item.id !== selectedID})
        remainingItems.map(obj => ({...obj, selected: false}))
    }

    getSelectedItemIndex(){
        return this.items.findIndex(item => item.selected === true)
    }

    setupWindow(){
        const thisWindowControl = new windowControl()
        thisWindowControl.createDiv(this.constructor.name)
        thisWindowControl.createSVG(this.constructor.name)
        this.dynamics = new menuDynamics(this.constructor.name, thisWindowControl)
    }

    setPosition(selectorToLeft, duration){
        let xStart = undefined
        try { xStart = selectorToLeft.getRightBoundary() }
        catch { xStart = 0}
        finally {return this.dynamics.move(xStart, duration)}
    }

    getRightBoundary(){
        const left = this.dynamics.getPositionLeft()
        const width = this.dynamics.getWidestItemWidth()
        return left + width
    }

}

class smeSelector extends selector {

    constructor(){
        super('SME')
    }

    load(){
        const data = this.getData()
        this.createItems(data)
        this.dynamics.renderItems(this.items)
        this.dynamics.contract(this.items)
    }

    getData(){
        return [
            'Side hustle',
            'Construction company',
            'Freelance profressional'
        ]
    }
}

class activitySelector extends selector {

    constructor(){
        super('Activity')
        this.setupSubscriptions()
    }

    setupSubscriptions(){
        const callback = this.SMESelectionChange.bind(this)
        selectionManager.subscribe('smeSelector', callback)
    }

    SMESelectionChange(SMEitem){
        switch(SMEitem.selected){
            case true:
                this.load(SMEitem)
                break;
            case false:
                this.unload()
                break;
            default:
                
        }
    }

    load(smeItem){
        const data = this.getData(smeItem.type)
        this.createItems(data)
        this.dynamics.renderItems(this.items)
        this.dynamics.expand(this.items)
    }

    getData(smeType){
        const activities = []
        switch(smeType){
            default:
            case 'Construction company':
                activities.push('paying employees')
            case 'Freelance profressional':
                activities.push('buying equipment')
            case 'Side hustle':
                activities.push('selling to a customer')
                activities.push('starting the business')
                activities.push('setting up fin. mgmt. systems')
        }
        return activities
    }

}

class displays {
    static smeSelector = {}
    static activitySelector = {}

    static async getDiv(displayName){
        const thisDiv = await d3.select('#' + displayName + 'Div')
        console.log(thisDiv)
        return thisDiv
    }

}

class smeData {
    static get(){
        return this.#types
    }

    static #types = [
        'Side hustle',
        'Construction company',
        'Freelance profressional'
    ]
}

class activityData {
    static get (dependencies){
        
        
        const activities = []
        switch(dependencies.smeType){
            default:
            case 'Construction company':
                activities.push('paying employees')
            case 'Freelance profressional':
                activities.push('buying equipment')
            case 'Side hustle':
                activities.push('selling to a customer')
                activities.push('starting the business')
                activities.push('setting up fin. mgmt. systems')
        }
        return activities
    }
}

class obligationData {

    static get (){

    }

}

class menuDynamics {

    constructor(menuTitle, windowControl){
        this.menuTitle = menuTitle
        this.windowControl = windowControl
    }

    expand(items){
        const currentWidth = this.windowControl.getWidth()
        const multipler = this.#calculateHeightMultipler('expanded', items)
        const expandedHeight = this.#calculateHeight(multipler)
        return this.windowControl.resize(currentWidth, expandedHeight, 400)
    }
    
    contract(items){
        const currentWidth = this.windowControl.getWidth()
        const multipler = this.#calculateHeightMultipler('contracted', items)
        const contractedHeight = this.#calculateHeight(multipler)
        return this.windowControl.resize(currentWidth, contractedHeight, 400)
    }

    move(leftOfX, duration){
        const left = leftOfX + 5
        const top = 40 //window.innerHeight - (window.innerHeight / gRatio
        return this.windowControl.reposition(left, top, duration)
    }

    #calculateHeight(multipler){
        return Math.round(menuItem.fontSize * gRatio) * multipler  
    }

    #calculateHeightMultipler(viewType, items){
        if(viewType === 'contracted'){
            return this.#getSelectedItemIndex(items) > 0 ? 2 : 1     
        } else {
            return items.length
        }
    }

    #getSelectedItemIndex(items){
        return items.findIndex(item => item.selected === true)    
    }

    renderItems(items){
        const svg = this.windowControl.svg
        const positioning = new menuItemPositioning (items)
        const styling = new menuItemStyling (items)

        svg.selectAll('g.' + this.menuTitle)
            .data(items, d => d.id)
            .join(
                enter => {

                    const groups = enter.append('g')
                        .attr('class', d => this.menuTitle + ' ' + d.type)
                        .attr('id', d => d.id)
                        .attr('transform', (d, i) => {return positioning.getTranslate(d, i)})
                        .on('mouseover', onItemHover)
                        .on('mouseout', (event, d) => onItemOff(event, d))
                        .on('click', onItemClick)

                    groups.append('text')
                        .text(d => d.type !== 'selector' ? d.label : '')
                        .style('fill', d => styling.getTextColour(d))
                        .attr('dx', 15)
                        .attr('dy', menuItem.fontSize)
                    
                    return groups
                },

                update => {

                    update
                        .transition('itemOrder')
                        .duration(350)
                        .attr('transform', (d, i) => {return positioning.getTranslate(d, i)})

                    /* groups.selectAll('text')
                        .style('font-weight', d => styling.getFontWeight(d))
 */
                    
                },
                exit => {
                    exit.remove()
                }
            )
    }

    getPositionLeft(){
        const leftString = this.windowControl.div.style('left')
        return parseInt(leftString.slice(0, leftString.indexOf('px')))
    }

    getWidestItemWidth(){
        const svg = this.windowControl.svg //d3.select('#' + this.menuTitle + 'Svg')
        const gItems = svg.selectAll('g')
        let widestWidth = 0
        gItems.each((d, i) => {
            const elemWidth = this.getElemWidth(d.id)
            if(elemWidth > widestWidth){
                widestWidth = elemWidth
            }
        })
        return widestWidth
    }

    getElemWidth(id){
        const elem = d3.select('#' + id)
        return parseInt(Math.ceil(elem.node().getBBox().width))
    }

}

class menuItemStyling {
    constructor(items){
        this.items = items
    }

    getTextColour(d){
        switch(d.type){
            case 'title':
                return 'blue'
            case 'selector':
                return 'grey'
            default:
                return 'black'
        }
    }

    getFontWeight(d){
        return d.selected ? 'bold' : 'normal'
    }
}

class menuItemPositioning {

    constructor(items){
        this.items = items
    }

    getTranslate(d, i){
        const x = this.getPosX(d)
        const y = this.getPosY(d, i)
        return d3Helper.getTranslateString(x, y)
    }

    getPosX(d){
        
        if(d.type === 'selector'){
            return 50
        } else {return 10}
        
    }
    
    getPosY(d, i){
        const listPos = this.getListPosition(d, i)
        return listPos * Math.round(menuItem.fontSize * 1.618)
    }

    getListPosition(d, i){
        const selectedIndex = this.getSelectedItemIndex()

        if(d.id === 'SideHustle'){
            console.log(i)
            console.log(selectedIndex)
        }

        if(selectedIndex < i){
            return d.type === 'selectable' ? i : i
        }

        if(selectedIndex === i){
            return 1
        }

        if(selectedIndex > i){
            return d.type === 'selectable' ? i + 1 : i
        }




    }

    getSelectedItemIndex(){
        return this.items.findIndex(item => item.selected === true)
    }

}

class menuItem {

    static fontSize = 12

    constructor(type, label, id){
        this.type = type
        this.label = label
        this.selected = false
        this.setID(id)
    }

    setID(id){
        if(id !== undefined){
            this.id = id
        } else {
            const arr = this.label.split(' ')
            this.id = arr.join('')
        }  
    }
}

class windowControl {
    
    div = {}
    svg = {}
    divWidth = 0
    divHeight = 0
    svgWidth = 0
    svgHeight = 0

    createDiv(id, container = d3.select('body')){
        this.div = container.append('div').attr('id', id + 'Div').style('position', 'absolute')
    }
    
    createSVG(id, container = this.div){
        this.svg = container.append('svg').attr('id', id + 'Svg')
    }

    getWidth(){
        const widthText = this.div.style('width')
        return widthText.slice(0, widthText.indexOf('px'))
    }

    resize(width, height, duration){

        const t = d3.transition()
            .ease(d3.easeCubicInOut)
            .duration(duration)

        this.div.transition(t)
            .style('width', width + "px")
            .style('height', height + "px")
        
        return t.end()

        this.resizeDiv(dimensions.width, dimensions.height, transition)
        //this.resizeSVG(dimensions.width, dimensions.height)
    }

    reposition(left, top, duration){ 
        
        const t = d3.transition()
            .ease(d3.easeCubicInOut)
            .duration(duration)
        
        this.div.transition(t)
            .style('left', left + 'px')
            .style('top', top + 'px')
        
        return t.end()

    }

    moveDiv(selection, duration){
        selection.transition()
            .ease(d3.easeCubicInOut)
            .duration(duration)
            .style('left', left + 'px')
            .style('top', top + 'px')
    }

    resizeDiv(width, height, t){
        this.div.transition(t)
            .style('width', width + "px").style('height', height + "px")
    }

    resizeSVG(width, height){
        this.svg.attr('width', width).attr('height', height)
    }

}

class d3Helper {
    static getTranslateString(x, y){
        return "translate(" + x + "," + y + ")"
    }
} 

