const gRatio = 1.618

class selectors {
    static enterprise = {}
    static activity = {}
    static obligation = {}
    static process = {}
    static mechanism = {}
}

window.onload = async function(){

    function setupSelectors(){
        selectors.enterprise = new selector ('enterprise')
        selectors.activity = new selector ('activity')
        selectors.obligation = new selector ('obligation')
    }

    function positionSelectors(){
        selectorControl.move('activity')
        selectorControl.move('obligation')
    }

    setupSelectors()
    positionSelectors()
    selectors.enterprise.load()
}

function onItemHover(){
    const targetElem = d3.select(this)
    const id = targetElem.attr('id')
    targetElem.attr('font-weight','bold')
    const allOtherElements = d3.selectAll('g').filter(d => d.id !== id)
    allOtherElements.attr('font-weight','normal')
}

function onItemOff(event, d){
    const elem = d3.select('#' + d.id)
    elem.attr('font-weight','normal')    
}

function onItemClick(){
    const targetElem = d3.select(this)
    selectionManager.itemSelectionChange(targetElem)
    //testSelectionFilters()
    //const classes = targetElem.attr('class').split(' ')
    //const displayTitle = classes[0]
    //thisDisplay = displayManager.getDisplay(displayTitle)
    //thisDisplay.itemClicked(targetElem.data()[0])
}


class displays {
    static enterpriseSelector = {}
    static activitySelector = {}

    static async getDiv(displayName){
        const thisDiv = await d3.select('#' + displayName + 'Div')
        return thisDiv
    }

    static load(displayName){
        
    }
}


class selectorControl {

    static load(selectorLabel){
        //renderItems
    }

    static move(selectorLabel, duration = 0){
        const left = this.getStartingLeft(selectorLabel)
        const top = 40 //window.innerHeight - (window.innerHeight / gRatio
        const div = d3.select('div#' + selectorLabel + 'SelectorDiv')
        div.transition()
            .ease(d3.easeCubicInOut)
            .duration(duration)
            .style('left', left + 'px')
            .style('top', top + 'px')
    }

    static getStartingLeft(selectorLabel){
        switch(selectorLabel){
            case 'enterprise':
                return 0
            case 'activity':
            case 'obligation':
                return 210
        }
    }

    static renderItems(selectorLabel){
        const svg = d3.select('#' + selectorLabel + 'SelectorSvg')
        const data = selectionManager.getItems(selectorLabel)
        const positioning = new menuItemPositioning (data)
        const styling = new menuItemStyling (data)
        const itemClassText = selectorLabel

        svg.selectAll('g.' + selectorLabel)
            .data(data, d => d.id)
            .join(
                enter => this.enterItems(enter, itemClassText, positioning, styling),
                update => this.updateItems(update, positioning, styling),
                exit => this.exitItems(exit)
            )
    }

    static enterItems(selection, itemClassText, positioning, styling){
        const groups = selection.append('g')
            .attr('id', d => d.id)
            .attr('class', itemClassText)
            .attr('transform', (d, i) => {return positioning.getTranslate(d, i)})
            .on('mouseover', onItemHover)
            .on('mouseout', (event, d) => onItemOff(event, d))
            .on('click', onItemClick)

        groups.append('text')
            .text(d => d.label)
            .style('fill', d => styling.getTextColour(d))
            .attr('dx', 15)
            .attr('dy', selectorItem.fontSize)
                    
        return groups
    }

    static updateItems(selection, positioning, styling){
         const groups = selection.transition('itemOrder')
            .duration(350)
            .attr('transform', (d, i) => {return positioning.getTranslate(d, i)})

        groups.select('text')
            .style('font-weight', d => styling.getFontWeight(d))
            .style('fill', d => styling.getTextColour(d))

        return groups
    }

    static exitItems(selection){
        return selection.remove()
    }

}

class selectionManager {


    static selectorArray = ()=>{
        return [
            selectors.enterprise,
            selectors.activity,
            selectors.obligation
        ]
    }

    static getSelectableItems(selectorLabel, selectedItemLabel){
        const selectorStates = this.getCurrentState()
        switch(selectorLabel){
            case 'enterprise':
                return enterpriseData.getSelectableItems(selectedItemLabel)
            case 'activity':
                return activityData.getSelectableItems(selectedItemLabel)
            case 'obligation':
        }
    }





    static getSelectorDependents = (selectorLabel) => {
        switch(selectorLabel){
            case 'enterprise':
                return ['activity']
            case 'activity':
                return ['obligation']
        }
    }

    static getCurrentState(){

        const selectors = this.selectorArray()
        let selections = []
        for(let i = 0; i < selectors.length; i++){
            try{
                const selectorLabel = selectors[i].getLabel()
                const selectedItemLabel = selectors[i].getSelectedItemLabel()
                selections[selectorLabel] = selectedItemLabel
            } catch {
                continue;
            }
        }

        return selections
    }

    static generateItems(selectorLabel){
        switch(selectorLabel){
            case 'enterprise':
                return enterpriseData.getItems()
            case 'activity':
                return activityData.getItems()
            case 'obligation':
                return obligationData.getItems()
        }
    }

    static addParentSelectors(selectorLabel){
        selectors[selectorLabel].items.forEach(item => item.setParentSelector(selectorLabel))
    }

    static getItems(selectorLabel){
        return selectors[selectorLabel].items
    }

    static itemSelectionChange(clickedItem){
        
        const selectorLabel = clickedItem.attr('class')
        const items = selectors[selectorLabel].items
        
        this.updateItemSelection(clickedItem, items)
        selectorControl.renderItems(selectorLabel)

        switch(selectorLabel){
            case 'enterprise':
                selectors['activity'].load()
        }

        this.getSelectableItems(selectorLabel)



/*         const itemLabel = selectorStates[selectorLabel]
        const dependents = this.getSelectorDependents(selectorLabel)
        
        console.log(activityData.getSelectableItems(itemLabel))
        
        dependents.forEach(label => {
            selectors[label]
            const selectableItems = getSelectableItems(itemLabel)
        })
        console.log(dependents)
 */
    }

    static updateItemSelection(clickedItem, items){
        const selectable = (item)=> item.constructor.name === 'selectorItem'
        const idMatch = (item)=> item.id === clickedItem.attr('id')
        items.forEach(item => {
            item.selected = selectable(item) && idMatch(item) && !item.selected ? true : false
        })
    }

    static updateSelectableStatus(selectorItems, selectableItemLabels){
        selectorItems.forEach(item => {
            item.selectable = selectableItemLabels.includes(item.label)
        })
    }

    static deselectOtherItems(items){
        const remainingItems = this.items.filter(item => {item.type === 'selectable', item.id !== selectedID})
        remainingItems.map(obj => ({...obj, selected: false}))
    }

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

    constructor(label){
        this.label = label
        this.id = label + 'Selector'
        this.setup()
    }

    setup(){
        this.createContainer()
        this.createCanvas()
        this.createItems()
    }

    load(){
        selectorControl.renderItems(this.label)
    }

    getItems(selectorStates){
        switch(this.label){
            case 'enterprise':
                return this.items
            
        }
    }


    createContainer(){
        this.div = d3.select('body')
            .append('div').attr('id', this.id + 'Div')
            .style('position', 'absolute')
    }

    createCanvas(){
        this.svg = this.div.append('svg')
            .attr('id', this.id + 'Svg')
    }

    createItems(){
        this.items = selectionManager.generateItems(this.label)
    }

    unloadItems(){
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

    getSelectedItem(){
        return this.items.find(item => item.selected === true)
    }

    getSelectedItemLabel(){
        const item = this.getSelectedItem()
        try{return item.label}
        catch{return undefined}
    }

    getLabel(){
        return this.label
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


class enterpriseData {  
    static getItems(){
        return [
            new selectorLabel ('enterprise'),
            new selectorItem ('side hustle'),
            new selectorItem ('construction company'),
            new selectorItem ('freelance profressional')
        ]
    }

    static getSelectableItems(){
        const allItems = this.getItems()
        return allItems.filter(item => item.constructor.name !== 'selectorLabel')
    }

}

class activityData {
    static getItems (){
        return [
            new selectorLabel ('activity'),
            new selectorItem ('paying employees'),
            new selectorItem ('selling to enterprise'),
            new selectorItem ('selling to a customer'),
            new selectorItem ('starting the business'),
            new selectorItem ('setting up fin. mgmt. systems')
        ]
    }

    static update(enterpriseType){
        const items = this.getItems()
        const targetLabels = this.getTargetLabels(enterpriseType)
        items.forEach(item => {
            item.selectable = targetLabels.includes(item.label)
        })
    }

    static getSelectableItems(){
        let labels = []
        const selectorStates = selectionManager.getCurrentState()
        
        switch(selectorStates['enterprise']){
            default:
            case 'construction company':
                labels.push('paying employees')
            case 'freelance profressional':
                labels.push('selling to enterprise')
            case 'side hustle':
                labels.push('selling to a customer')
                labels.push('starting the business')
                labels.push('setting up fin. mgmt. systems')
        }
        
        return labels
    }
}

class obligationData {

    static getItems (){
        return [
            new selectorLabel ('obligation'),
            new selectorItem ('register for income tax'),
            new selectorItem ('record keep for income tax'),
            new selectorItem ('calculate income tax'),
            new selectorItem ('report income tax'),
            new selectorItem ('pay income tax'),
            new selectorItem ('calculate vat'),
            new selectorItem ('collect vat'),
            new selectorItem ('report vat'),
            new selectorItem ('pay vat'),
            new selectorItem ('calculate payroll tax'),
            new selectorItem ('collect payroll tax'),
            new selectorItem ('report payroll tax'),
            new selectorItem ('pay payroll tax'),
        ]
    }

    static getSelectableItems (){
        const selectorStates = selectionManager.getCurrentState()
        const itemsEnterprise = this.getEnterpriseSelectableItems(selectorStates['enterprise'])
        const itemsActivity = this.getActivitySelectableItems(selectorStates['activity'])
        return itemsEnterprise.filter(item => itemsActivity.includes(item))
    }

    static getEnterpriseSelectableItems(enterpriseSelection){
        const labels = []
        switch(enterpriseSelection){
            default:
            case 'construction company':
                labels.push ('calculate payroll tax')
                labels.push ('collect payroll tax')
                labels.push ('report payroll tax')
                labels.push ('pay payroll tax')
            case 'freelance profressional':
                labels.push ('calculate vat')
                labels.push ('collect vat')
                labels.push ('report vat')
                labels.push ('pay vat')
            case 'side hustle':
                labels.push ('register for income tax')
                labels.push ('record keep for income tax')
                labels.push ('calculate income tax')
                labels.push ('report income tax')
                labels.push ('pay income tax')
        }
        return labels
    }

    static getActivitySelectableItems(activitySelection){
        const labels = []
        switch(activitySelection){
            case 'paying employees':
                labels.push ('calculate payroll tax')
                labels.push ('collect payroll tax')
                labels.push ('report payroll tax')
                labels.push ('pay payroll tax')
                break;
            
            case 'selling to a customer':
                labels.push ('record keep for income tax')
                labels.push ('calculate vat')
                labels.push ('collect vat')
                labels.push ('report vat')
            
            case 'selling to enterprise':
                labels.push ('pay vat')
                break;
            
            case 'starting the business':
                labels.push ('register for income tax')
                labels.push ('register for vat')
                break;

            case 'setting up fin. mgmt. systems': 
                labels.push ('collect payroll tax')
                labels.push ('calculate income tax')
                labels.push ('report income tax')
                labels.push ('pay income tax')
                break;
        }
        return labels
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
        return Math.round(selectorItem.fontSize * gRatio) * multipler  
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
        switch(d.constructor.name){
            case 'selectorLabel':
                return 'blue'
            case 'selectorItem':
                return d.selectable ? 'black' : 'grey'
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
        return listPos * Math.round(selectorItem.fontSize * 1.618)
    }

    getListPosition(d, i){
        return i
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

class selectorItem {

    static fontSize = 12

    constructor(label, selectable = true){
        this.label = label
        this.selectable = selectable
        this.setID()
    }

    setID(){
        this.id = this.constructor.name === 'selectorLabel' ? 'label' : this.label.replaceAll(' ','')
    }

    setParentSelector(selectorLabel){
        this.parentSelector = selectorLabel
    }
}

class selectorLabel extends selectorItem {
    constructor(label){
        super(label, false)
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

