const gRatio = 1.618

class styles {
    static pageColour = '#F6F7F9'
    static divColour = 'white'
    static divShadowUp = '5px 5px 10px rgba(0, 0, 0, 0.3)'
    static divShadowDown = '0px 0px 0px rgba(0, 0, 0, 0.3)'
}

class selectors {
    static enterprise = {}
    static activity = {}
}

class connectors {
    static obligations = []
    static capabilities = []
    static mechanisms = []
}


window.onload = async function(){

    function createSelectors(){
        selectors.enterprise = new selector ('enterprise')
        selectors.activity = new selector ('activity')
    }

    createSelectors()
    await loadSelectors()
}

async function loadSelectors(){
    await loadSelector('enterprise')
    await loadSelector('activity')
    return Promise.resolve()
}

async function loadObligations(){
    const obligations = obligationData.getSelectableItems()
    return createConnectors(obligations, 'obligation')
}

async function loadConnectors(){
    const obligations = obligationData.getSelectableItems()
    const mechanisms = mechanismData.getObligationSelectableItems()
    console.log(mechanisms)
    return createConnectors(obligations, 'obligation')
}

async function createConnectors(connectorItemLabels, type){
    const transitions = []
    
    for(let i = 0; i < connectorItemLabels.length; i++){
        const itemLabel = connectorItemLabels[i]
        const cn = new connector(type, itemLabel, i)
        cn.setup()
        connectors.obligations.push(cn) 
        transitions[i] = connectorControl.renderItems(cn.id, cn.label, cn.itemLabel, cn.type)
        connectorControl.surfaceConnector(cn.id, i)
    }

    return Promise.all(transitions)

}

function unloadConnectors(){

    const obligations = connectors.obligations

    for(let i = 0; i < obligations.length; i++){
        connectorControl.sinkConnector(obligations[i].id, i)
    }
    
}

async function loadSelector(selectorLabel){
    moveSelector(selectorLabel)
    await selectorControl.load(selectorLabel)
    selectorControl.resize(selectorLabel)
}

async function loadConnector(connectorLabel){
    //moveSelector(connectorLabel)
    await connectorControl.load(connectorLabel)
    connectorControl.resize(connectorLabel)
}

function moveSelector(selectorLabel){
    selectorControl.move(selectorLabel)
}
function resizeSelector(selectorLabel){
    selectorControl.resize(selectorLabel)
}

function onItemHover(event, d){
    selectionManager.itemHighlightChange(d, event.type)
}

function onItemOff(event, d){
    selectionManager.itemHighlightChange(d, event.type)
}

function onItemClick(event, d){
    selectionManager.itemSelectionChange(d)
}

class selectorControl {

    static async load(selectorLabel){
        selectionManager.updateSelectableStatus(selectorLabel)
        return this.renderItems(selectorLabel)
    }

    static move(selectorLabel, duration = 0){
        const left = this.getStartingLeft(selectorLabel)
        const top = this.getStartingTop(selectorLabel)
        const div = d3.select('div#' + selectorLabel + 'SelectorDiv')
        div.transition()
            .ease(d3.easeCubicInOut)
            .duration(duration)
            .style('left', left + 'px')
            .style('top', top + 'px')
    }

    static getStartingLeft(selectorLabel){
        let boundary = null
        const selectorToLeft = this.getSelectorToLeft(selectorLabel)
        try { boundary = this.getRightBoundary(selectorToLeft)}
        catch { boundary = 0}
        finally { return boundary + 15}
    }

    static getSelectorToLeft(selectorLabel){
        switch(selectorLabel){
            case 'activity':
            case 'obligation':
                return 'enterprise'
        }
    }

    static getRightBoundary(selectorLabel){
        const div = d3.select('div#' + selectorLabel + 'SelectorDiv')
        const left = this.pxStringToInteger(div.style('left'))
        const width = this.pxStringToInteger(div.style('width'))
        return left + width
    }
 

    static pxStringToInteger(pxString){
        return parseInt(pxString.slice(0, pxString.indexOf('px')))
    }

    static getStartingTop(selectorLabel){
        let boundary = null
        const selectorAbove = this.getSelectorAbove(selectorLabel)
        try { boundary = this.getBottomBoundary(selectorAbove)}
        catch { boundary = 0}
        finally {return boundary + 15}
    }

    static getSelectorAbove(selectorLabel){
        switch(selectorLabel){
            case 'obligation':
                return 'activity'
        }
    }

    static getBottomBoundary(selectorLabel){
        const div = d3.select('div#' + selectorLabel + 'SelectorDiv')
        const top = this.pxStringToInteger(div.style('top'))
        const height = this.pxStringToInteger(div.style('height'))
        return top + height  
    }

    static contract(selectorLabel){
        const div = d3.select('div#' + selectorLabel + 'SelectorDiv')
        const height = Math.round(selectorItem.fontSize * gRatio) * 2 + selector.padding * 2
        div.transition().duration(300).style('height', height + 'px')
    }

    static expand(selectorLabel){
        const div = d3.select('div#' + selectorLabel + 'SelectorDiv')
        const itemCount = selectors[selectorLabel].getItemCount()
        const height = Math.round(selectorItem.fontSize * gRatio) * itemCount + selector.padding * 2
        div.transition().duration(300).style('height', height + 'px')
    }


    static resize(selectorLabel, duration = 500){
        const div = d3.select('div#' + selectorLabel + 'SelectorDiv')
        const svg = d3.select('svg#'+ selectorLabel + 'SelectorSvg')
        const itemCount = selectors[selectorLabel].getItemCount()
        const width = this.getWidestItemWidth(svg) + selector.padding * 3
        const height = Math.round(selectorItem.fontSize * gRatio) * itemCount + selector.padding * 2
        div.style('height', height + 'px').style('width', width + 'px')
        svg.attr('width', width).attr('height', height)
    }

    static getWidestItemWidth(svg){
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

    static getElemWidth(id){
        const elem = d3.select('#' + id)
        return parseInt(Math.ceil(elem.node().getBBox().width))
    }

    static async renderItems(selectorLabel){
        const svg = d3.select('#' + selectorLabel + 'SelectorSvg')
        const data = selectionManager.getItems(selectorLabel)
        const fn = {
            positioning: new selectorItemPositioning (data),
            styling: new selectorItemStyling (data),
            selectorLabel: selectorLabel
        }

        let enterTransition = null;
        let updateTransition = null;

        svg.selectAll('g.' + selectorLabel)
            .data(data, d => d.id)
            .join(
                enter => {
                    const t = this.enterItems(enter, fn)
                    enterTransition = t
                    return t
                },
                update => {
                    const t = this.updateItems(update, fn)
                    updateTransition = t
                    return t
                },
                exit => this.exitItems(exit, fn)
            )

        return enterTransition.end()

    }

    static enterItems(selection, fn){

        const groups = selection.append('g')
            .attr('id', d => d.id)
            .attr('class', fn.selectorLabel)
            .attr('transform', (d, i) => {return fn.positioning.getTranslate(d, i)})
            .on('mouseover', (event, d) => onItemHover(event, d))
            .on('mouseout', (event, d) => onItemOff(event, d))
            .on('click', (event, d) => onItemClick(event, d))

        const text = groups.append('text')
            .text(d => d.label)
            .style('fill', 'white')
            .attr('dx', 0)
            .attr('dy', selectorItem.fontSize)
            //.attr('text-anchor', d => fn.styling.getTextAnchor(d, fn))
            
        return text.transition('textAppearing')
            .duration(0)
            .delay((d, i) => i * 0)
            .style('fill', d => fn.styling.getTextColour(d))

    }

    static updateItems(selection, fn){
        const groups = selection.transition('itemOrder')
            .duration(350)
            .attr('transform', (d, i) => {return fn.positioning.getTranslate(d, i)})

        groups.select('text')
            .style('font-weight', d => fn.styling.getFontWeight(d))
            .style('fill', d => fn.styling.getTextColour(d))
            

        return groups
    }

    static exitItems(selection, fn){
        return selection.remove()
    }

}



class selectorItemStyling {
    constructor(items){
        this.items = items
    }

    getTextColour(d, i){
        const selectedItemIndex = this.getSelectedItemIndex()

        if(d.constructor.name === 'selectorLabel'){
            return '#336BF0'
        }  else if (selectedItemIndex > 0){
            return d.selected ? '#131C3E' : 'white'
        } else if (d.selectable) {
            return '#131C3E'
        } else {
            return '#AEB3BD'
        }
    }

    getFontWeight(d){
        return d.selected ? 'bold' : 'normal'
    }

    getTextAnchor(d, fn){
        return fn.selectorLabel === 'obligation' ? 'end' : 'start'
    }

    getSelectedItemIndex(){
        return this.items.findIndex(item => item.selected === true)
    }

}


class selectorItemPositioning {

    constructor(items){
        this.items = items
    }

    getTranslate(d, i){
        const x = this.getPosX(d)
        const y = this.getPosY(d, i)
        return d3Helper.getTranslateString(x, y)
    }

    getPosX(d){
        const selectedIndex = this.getSelectedItemIndex()

        if(selectedIndex === -1){
            return selector.padding
        } else {
            return !d.selected && d.constructor.name !== 'selectorLabel' ? - 300 : selector.padding
        }
    }
    
    getPosY(d, i){
        const listPos = this.getListPosition(d, i)
        return listPos * Math.round(selectorItem.fontSize * 1.618) + selector.padding
    }

    getListPosition(d, i){
        
        if (d.constructor.name === 'selectorLabel'){
            return i
        } else if (d.selected){
            return 1
        } else {
            return i
        }
    }

    getSelectedItemIndex(){
        return this.items.findIndex(item => item.selected === true)
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

    static getSelectableItems(selectorLabel){
        switch(selectorLabel){
            case 'enterprise':
                return enterpriseData.getSelectableItems()
            case 'activity':
                return activityData.getSelectableItems()
            case 'obligation':
                return obligationData.getSelectableItems()
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

    static getAllItems(selectorLabel){
        switch(selectorLabel){
            case 'enterprise':
                return enterpriseData.getItems()
            case 'activity':
                return activityData.getItems()
            case 'obligation':
                return obligationData.getItems()
        }
    }


    static itemHighlightChange(d, eventType){
        const selectable = (item)=> item.constructor.name === 'selectorItem' && item.selectable
        const selected = (item) => item.selected

        if(!selected(d) && selectable(d)){
            const elem = d3.select('#' + d.id)
            const fontWeight = eventType === 'mouseover' ? 'bold' : 'normal'
            elem.select('text').style('font-weight', fontWeight)
        }
    }

    static async itemSelectionChange(d){
        //const elem = d3.select('#' + d.id)
        const selectorLabel = d.parentLabel //elem.attr('class')
        //console.log(selectorLabel)
        const items = this.getDisplayItems(d.parentLabel)
        

        this.updateItemSelection(d, items)

       switch(d.parentLabel){
            case 'enterprise':
            case 'activity':
                this.renderSelectorSelectionChange(d.parentLabel, items)
                this.updateConnectors()
                break;
            case 'obligation':
                this.renderConnectorSelectionChange()
        }
 
    }


    static getDisplayItems(displayLabel){
        switch(displayLabel){
            case 'enterprise':
            case 'activity':
                return selectors[displayLabel].items
            case 'obligation':
                return connectors.obligations[0].items
        }
    }

    static getItems(selectorLabel){
        return selectors[selectorLabel].items
    }
  

    static renderSelectorSelectionChange(selectorLabel, items){
        
        if(items.some(item => item.selected)){
            selectorControl.contract(selectorLabel)
        } else {
            selectorControl.expand(selectorLabel)
        }

        selectorControl.renderItems(selectorLabel)

        if(selectorLabel === 'enterprise'){
            this.updateSelectableStatus('activity')
            selectorControl.renderItems('activity')
        }
        

    }

    static renderConnectorSelectionChange(){
        
    }

    static updateConnectors(){
         const selectionsMade = () => {
            const selectorStates = this.getCurrentState()
            const keys = Object.keys(selectorStates)
        
            for (const key of keys){
                if(selectorStates[key] === undefined){
                    return false
                }
            }

            return true
        }

        if(selectionsMade()){
            loadConnectors()
        } else {
            unloadConnectors()
        }
    }

    static updateItemSelection(d, items){
        const selectable = (item)=> item.constructor.name === 'selectorItem'
        const idMatch = (item)=> item.id === d.id
        items.forEach(item => {
            item.selected = selectable(item) && idMatch(item) && !item.selected ? true : false
        })

    }

    static updateSelectableStatus(selectorLabel){
        const selectorItems = selectors[selectorLabel].items
        const selectableItemLabels = this.getSelectableItems(selectorLabel)

        selectorItems.forEach(item => {
            if(selectableItemLabels.includes(item.label)){
                item.selectable = true
            } else {
                item.selectable = false
            }
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

class connector {

    static padding = 15
    items = []

    constructor(type, itemLabel, posNum){
        this.id = type + (posNum + 1)
        this.label = type + ' #' + (posNum + 1)
        this.itemLabel = itemLabel
        this.posNum = posNum
        this.type = type
    }

    setup(){
        this.createContainer()
        this.createCanvas()
        this.createItems()
    }

    createContainer(){
        const left = 1000
        const top = this.posNum * 60 + 100
        const height = Math.round(selectorItem.fontSize * gRatio) * 2 + selector.padding * 2
        
        this.div = d3.select('body')
            .append('div')
            .attr('id', this.id + 'Div')
            .style('position', 'absolute')
            .style('background-color', styles.pageColour)
            .style('box-shadow', styles.divShadowDown)
            .style('left', left + 'px')
            .style('top', top + 'px')
            .style('height', height + 'px')
    }

    createCanvas(){
        this.svg = this.div.append('svg')
            .attr('id', this.id + 'Svg')
    }

    createItems(){
        this.items = [
            new selectorLabel(this.label),
            new selectorItem(this.itemLabel, true)
        ]

        this.items.forEach(item => item.parentLabel = this.label)
    }

}

class connectorControl {
    static async renderItems(id, label, itemLabel, type){

        const svg = d3.select('#' + id + 'Svg')
        
        const data = [
            new selectorLabel(label),
            new selectorItem(itemLabel, true)
        ]

        data.forEach(item => item.parentLabel = type)


        const fn = {
            positioning: new connectorItemPositioning (data),
            styling: new connectorItemStyling (data),
        }

        let enterTransition = null;
        let updateTransition = null;

        svg.selectAll('g')
            .data(data, d => d.id)
            .join(
                enter => {
                    const t = this.enterItems(enter, fn)
                    enterTransition = t
                    return t
                },
                update => {
                    const t = this.updateItems(update, fn)
                    updateTransition = t
                    return t
                },
                exit => this.exitItems(exit, fn)
            )

        return Promise.all([enterTransition.end(), updateTransition.end()])

    }

    static enterItems(selection, fn){

        const groups = selection.append('g')
            .attr('id', d => d.id)
            .attr('transform', (d, i) => {return fn.positioning.getTranslate(d, i)})
            .on('mouseover', (event, d) => onItemHover(event, d))
            .on('mouseout', (event, d) => onItemOff(event, d))
            .on('click', (event, d) => onItemClick(event, d))
            

        const text = groups.append('text')
            .text(d => d.label)
            .style('fill', styles.pageColour)
            .attr('dx', 0)
            .attr('dy', selectorItem.fontSize)
            
        return text.transition('textAppearing')
            .duration(1000)
            .style('fill', d => fn.styling.getTextColour(d))

    }

    static updateItems(selection, fn){
        const groups = selection.transition('itemOrder')
            .duration(350)
            .attr('transform', (d, i) => {return fn.positioning.getTranslate(d, i)})

        groups.select('text')
            .style('font-weight', d => fn.styling.getFontWeight(d))
            .style('fill', d => fn.styling.getTextColour(d))
            

        return groups
    }

    static exitItems(selection, fn){
        return selection.remove()
    }

    static surfaceConnector(id, posNum){
        const left = 15
        const div = d3.select('div#' + id + 'Div')
        div.transition()
            .ease(d3.easeCubicInOut)
            .duration(350)
            .delay(posNum * 50)
            .style('left', left + 'px')
            .style('background-color', styles.divColour)
            .style('box-shadow', styles.divShadowUp)
    }

    static sinkConnector(id, posNum){
        const left = 1000
        const div = d3.select('div#' + id + 'Div')
        const t = div.transition()
            .ease(d3.easeCubicInOut)
            .duration(350)
            .delay(posNum * 50)
            .style('left', left + 'px')
            .style('background-color', styles.pageColour)
            .style('box-shadow', styles.divShadowDown)
            
        t.end().then(() => div.remove())

    }
}

class connectorItemStyling {
    getTextColour(d, i){
        if(d.constructor.name === 'selectorLabel'){
            return '#336BF0'
        }  else {
            return '#131C3E'
        }
    }

    getFontWeight(d){
        return d.selected ? 'bold' : 'normal'
    }

}

class connectorItemPositioning {

    getTranslate(d, i){
        const x = selector.padding
        const y = i * Math.round(selectorItem.fontSize * 1.618) + selector.padding
        return d3Helper.getTranslateString(x, y)
    }

}


class selector {

    items = []
    static padding = 15

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

    createContainer(){
        this.div = d3.select('body')
            .append('div').attr('id', this.id + 'Div')
            .style('position', 'absolute')
            .style('height', '1000px')
            .style('background-color', 'white')
            .style('border-radius', '10px')
            .style('box-shadow', '5px 5px 10px rgba(0, 0, 0, 0.3)')

    }

    createCanvas(){
        this.svg = this.div.append('svg')
            .attr('id', this.id + 'Svg')
    }

    createItems(){
        this.items = selectionManager.getAllItems(this.label)
        this.items.forEach(item => item.parentLabel = this.label)
    }

    unloadItems(){
        this.items = []
    }

    getItemCount(){
        return this.items.length
    }

    getItem(id){
        return this.items.find(item => item.id === id)
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
        return selectors['enterprise'].items.map(item => item.label)
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
            new selectorItem ('setting up fin mgmt systems')
        ]
    }

    static getSelectableItems(){
        let labels = []
        const selectorStates = selectionManager.getCurrentState()
        
        switch(selectorStates['enterprise']){
            case 'construction company':
                labels.push('paying employees')
            case 'freelance profressional':
                labels.push('selling to enterprise')
            case 'side hustle':
                labels.push('selling to a customer')
                labels.push('starting the business')
                labels.push('setting up fin mgmt systems')
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

            case 'setting up fin mgmt systems': 
                labels.push ('collect payroll tax')
                labels.push ('calculate income tax')
                labels.push ('report income tax')
                labels.push ('pay income tax')
                break;
        }
        return labels
    }

    

}

class mechanismData {

    static getItems (){
        return [
            new selectorLabel ('mechanism'),
            new selectorItem ('entreprenuers bank account'),
            new selectorItem ('government business registry'),
        ]
    }


    static getObligationSelectableItems(obligationSelection){
        console.log(obligationSelection)
        const labels = []
        switch(obligationSelection){
            case 'calculate income tax':
            case 'report income tax': 
            case 'pay income tax':
                labels.push('entreprenuers bank account')
                break;
            case 'register for income tax':
                labels.push('entreprenuers bank account')
                labels.push('government business registry')
            break;
        }
        return labels
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

    getWidth(){
        const widthText = this.div.style('width')
        return widthText.slice(0, widthText.indexOf('px'))
    }


}

class d3Helper {
    static getTranslateString(x, y){
        return "translate(" + x + "," + y + ")"
    }
}
