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
    displayOrchestration.setup()
    displayOrchestration.createDisplay('listBoxCard', 'Enterprise')
    displayOrchestration.createDisplay('listBoxCard', 'Activity')

    await displayOrchestration.loadCard('enterprise')
    displayOrchestration.loadCard('activity')

}

class displays {
    static cards = {}

    static addCard(card){
        this.cards[card.id] = card
    }

}

class displayOrchestration {
    static #factory = {}
    static #cardControl = {}
    static #selectionManager = {}
    
    static setup(){
        this.#factory = new cardFactory
        this.#cardControl = new cardControl
        this.#selectionManager = new selectionManager
    }

    static createDisplay(displayType, displayTitle){
        switch(displayType){
            case 'listBoxCard':
                displays.addCard(this.#factory.createCard(displayType, displayTitle))
        }
    }


    static loadCard(cardID){
        const card = displays.cards[cardID]
        return this.#cardControl.load(card)
    }

    static updateFromItemClick(clickedItem){
        const clickedCard = displays.cards[clickedItem.cardID]
        this.#selectionManager.updateItemSelection(clickedItem.id, clickedCard.items)
        this.#cardControl.renderSelectionChange(clickedCard)
        this.updateSelectableState()
    }

    static updateSelectableState(){
        const cardArray = Object.values(displays.cards)

        for(let i = 0; i < cardArray.length; i++){
            const card = cardArray[i]
            const selectableItemLabels = this.#selectionManager.getSelectableItems(card)
            if(selectableItemLabels !== null){
                this.#cardControl.renderSelectabilityChange(card, selectableItemLabels)
            }
        }

    }

}

class subscriptionManager {



    subscribers = {}
    subscribe(selectionEvent, callback){
        if (!this.subscribers[selectionEvent]) {
            this.subscribers[selectionEvent] = [];
        }
        this.subscribers[selectionEvent].push(callback);
    }

    publish(selectionEvent, data){
        if (this.subscribers[selectionEvent]) {
            this.subscribers[selectionEvent].forEach(callback => {
                callback(data);
            });
        }
    }
}

class listBoxCard {
    maxVisibleItems = 6
    left = 0
    top = 0
    constructor(title){
        this.title = title
        this.id = this.title.toLowerCase()
    }
}
class optionCard {
    constructor(title){
        this.title = title
        this.id = this.title.toLowerCase()
    }
}

class cardHolder {
    static cards = {}

    static add(card){
        this.cards[card.id] = card
    }

}

class cardPositioning {
    static calculateStartingPosition(card){
        const cardToLeft= this.getCardToLeft(card)
        return {
            left: this.calculateX(cardToLeft),
            top: this.calculateY(cardToLeft)
        }
    }

    static calculateX(cardToLeft){
        if(cardToLeft !== null){
            const left = parseInt(this.getCardLeftValue(cardToLeft.id))
            const width = parseInt(cardSizing.calculateCardWidth(cardToLeft.id))
            return left + width + cardSizing.padding
        } else {
            return cardSizing.padding
        }

    }

    static calculateY(cardAbove){
            return cardSizing.padding
    }

    static getCardLeftValue(cardID){
        const stringLeft = d3.select('#' + cardID + 'Div').style('left')
        return stringLeft.slice(0, stringLeft.indexOf('px'))
    }
    
    static getCardToLeft(card){ 
        switch(card.title){
            case 'Enterprise':
                return null;
            case 'Activity':
                return displays.cards['enterprise']
        }
    }

    static getCardAbove(cardAbove){
        return 0
    }
}

class cardSizing {
    static padding = 15
    
    static calculateCardWidth (cardID){
        const widestItem = this.getWidestItemWidth(cardID)
        return widestItem + cardSizing.padding * 3
    }

    static getWidestItemWidth(cardID){
        const svg = d3.select('#' + cardID + 'Svg')
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

}

class cardFactory {

    createCard(type, title){
        const card = this.#createObject(type, title)
        this.#addDiv(card)
        this.#addSvg(card)
        return card
    }
    
    #createObject(type, title){
        switch(type){
            case 'listBoxCard':
                return new listBoxCard(title)
            case 'optionCard':
                return new optionCard(title)
        }
    }

    #addDiv(card){
        card.div = d3.select('body')
            .append('div')
            .attr('id', card.id + 'Div')
            .style('position', 'absolute')
            .style('border-radius', '10px')
            .style('box-shadow', '0px 0px 0px rgba(0, 0, 0, 0)')
    }

    #addSvg(card){
        card.svg = card.div.append('svg')
            .attr('id', card.id + 'Svg')
    }

}

class cardControl {

    constructor(){
        this.handler = new dataHandler ()
        this.dynamics = new cardDynamics ()
        this.contentDynamics = new cardContentDynamics ()
    }

    async load(card){
        card.items = this.handler.getCardData(card.title)
        this.contentDynamics.renderItems(card)
        this.dynamics.expand(card)
        this.dynamics.move(card, cardPositioning.calculateStartingPosition(card))
        return this.dynamics.emerge(card)
    }

    renderSelectionChange(card){
        if(card.items.some(item => item.selected)){
            this.dynamics.contract(card)
        } else {
            this.dynamics.expand(card)
        }

        this.contentDynamics.renderItems(card)
    }

    renderSelectabilityChange(card, selectableItemLabels){

        card.items.forEach(item => {
            if(selectableItemLabels.includes(item.label)){
                item.selectable = true
            } else {
                item.selectable = false
            }
        })

        this.contentDynamics.renderItems(card)
    }

}

class cardDynamics {

    emerge(card){
        return card.div.transition()
            .duration(300)
            .ease(d3.easeCubicIn)
                .style('background-color', 'white')
                .style('box-shadow', '5px 5px 10px rgba(0, 0, 0, 0.3)')
            .end()
    }

    expand(card){
        const calculateHeight = (itemCount) => {
            const itemHeight = Math.round(cardItem.fontSize * 1.618)
            return itemCount * itemHeight + cardSizing.padding * 2
        }

        const width = cardSizing.calculateCardWidth(card.id)

        const divHeight = calculateHeight(card.maxVisibleItems)
        const svgHeight = calculateHeight(card.items.count)

        card.div.transition()
            .duration(400)
                .style('height', divHeight + 'px')
                .style('width', width + 'px')

        card.svg.style('height', svgHeight).style('width', width)
    }

    move(card, coordinates){
        card.div.style('top', coordinates.top + 'px')
            .style('left', coordinates.left + 'px')
    }

    contract(card){
        const calculateHeight = (itemCount) => {
            const itemHeight = Math.round(cardItem.fontSize * 1.618)
            return itemCount * itemHeight + cardSizing.padding * 2
        }

        const width = cardSizing.calculateCardWidth(card.id)

        const divHeight = calculateHeight(2)
        const svgHeight = calculateHeight(card.items.count)

        card.div.transition()
            .duration(400)
                .style('height', divHeight + 'px')
                .style('width', width + 'px')
        
        
        
        card.svg.style('height', svgHeight)

    }




}

class cardContentDynamics {
    async renderItems(card){
        const fn = {
            positioning: new cardItemPositioning (card.items),
            styling: new cardItemStyling (card.items),
        }

        const transitions = []

        card.svg.selectAll('g')
            .data(card.items, d => d.id)
            .join(
                enter => {
                    const t = this.enterItems(enter, fn)
                    transitions.push(t)
                    return t
                },
                update => {
                    const t = this.updateItems(update, fn)
                    transitions.push(t)
                    return t
                },
                exit => this.exitItems(exit, fn)
            )
        
        //return Promise.all(transitions.map(t => t.end()))

    }

    enterItems(selection, fn){

        const groups = selection.append('g')
            .attr('id', d => d.id)
            .attr('class', fn.cardLabel)
            .attr('transform', (d, i) => {return fn.positioning.getTranslate(d, i)})
            .on('mouseover', (event, d) => onItemHover(event, d))
            .on('mouseout', (event, d) => onItemOff(event, d))
            .on('click', (event, d) => onItemClick(event, d))

        const text = groups.append('text')
            .text(d => d.label)
            .style('fill', 'white')
            .attr('dx', 0)
            .attr('dy', cardItem.fontSize)
            
        return text.transition('textAppearing')
            .duration(350)
            .ease(d3.easeCircleIn) 
            .style('fill', d => fn.styling.getTextColour(d))

    }

    updateItems(selection, fn){
        const groups = selection.transition('itemOrder')
            .duration(350)
            .attr('transform', (d, i) => {return fn.positioning.getTranslate(d, i)})

        groups.select('text')
            .style('font-weight', d => fn.styling.getFontWeight(d))
            .style('fill', d => fn.styling.getTextColour(d))
            

        return groups
    }

    exitItems(selection, fn){
        return selection.remove()
    }
}

class dataHandler{
    getCardData(title){
        switch(title){
            case 'Enterprise':
                return enterpriseData.getItems()
            case 'Activity':
                return activityData.getItems()
        }
    }
}

async function loadObligations(){
    const obligations = obligationData.getSelectableItems()
    return createConnectors(obligations, 'obligation')
}

async function loadConnectors(){
    const obligations = obligationData.getSelectableItems()
    const mechanisms = mechanismData.getObligationSelectableItems()
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

async function loadConnector(connectorLabel){
    //moveSelector(connectorLabel)
    await connectorControl.load(connectorLabel)
    connectorControl.resize(connectorLabel)
}

function onItemHover(event, d){
    selectionManager.itemHighlightChange(d, event.type)
}

function onItemOff(event, d){
    selectionManager.itemHighlightChange(d, event.type)
}

function onItemClick(event, d){
    displayOrchestration.updateFromItemClick(d)
}


class cardItemStyling {
    constructor(items){
        this.items = items
    }

    getTextColour(d, i){
        const selectedItemIndex = this.getSelectedItemIndex()

        if(d.constructor.name === 'cardLabel'){
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
        return fn.cardLabel === 'obligation' ? 'end' : 'start'
    }

    getSelectedItemIndex(){
        return this.items.findIndex(item => item.selected === true)
    }

}


class cardItemPositioning {

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
            return cardSizing.padding
        } else {
            return !d.selected && d.constructor.name !== 'cardLabel' ? - 300 : cardSizing.padding
        }
    }
    
    getPosY(d, i){
        const listPos = this.getListPosition(d, i)
        return listPos * Math.round(cardItem.fontSize * 1.618) + cardSizing.padding
    }

    getListPosition(d, i){
        
        if (d.constructor.name === 'cardLabel'){
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
    subscribers = {}

    getSelectedItemLabel(items){
        const selectedItem = this.getSelectedItem(items)
        try{return selectedItem.label}
        catch{return undefined}
    }

    getSelectedItem(items){
        return items.find(item => item.selected === true)
    }

    updateItemSelection(itemID, itemsOnCard){
        const selectable = (item)=> item.selectable
        const idMatch = (item)=> item.id === itemID
        itemsOnCard.forEach(item => {
            item.selected = selectable(item) && idMatch(item) && !item.selected ? true : false
        })
    }

    getSelectableItems(card){

        switch(card.id){
            case 'activity':
                const selectedEnterprise = this.getSelectedItemLabel(displays.cards['enterprise'].items)
                return activityData.getSelectableItems(selectedEnterprise)
                
            case 'enterprise':
                return null
        }
    }

    

    
    getSelectionState(){
        const cardArray = Object.values(displays.cards)
        let selectionsArray = {}
        cardArray.forEach(card => {
            selectionsArray[card.id] = this.getSelectedItemLabel(card.items)
        })
        return selectionsArray
    }




    getDependentItems(item, card){
        switch(card){
            case 'enterprise':
                return activityData.getSelectableItems()

        }
    }
    

    static selectorArray = ()=>{
        return [
            selectors.enterprise,
            selectors.activity,
            selectors.obligation
        ]
    }

 

    static getCurrentState(){

        const selectors = this.selectorArray()
        let selections = []
        for(let i = 0; i < selectors.length; i++){
            try{
                const cardLabel = selectors[i].getLabel()
                const selectedItemLabel = selectors[i].getSelectedItemLabel()
                selections[cardLabel] = selectedItemLabel
            } catch {
                continue;
            }
        }

        return selections
    }

    static getAllItems(cardLabel){
        switch(cardLabel){
            case 'enterprise':
                return enterpriseData.getItems()
            case 'activity':
                return activityData.getItems()
            case 'obligation':
                return obligationData.getItems()
        }
    }


    static itemHighlightChange(d, eventType){
        const selectable = (item)=> item.constructor.name === 'cardItem' && item.selectable
        const selected = (item) => item.selected

        if(!selected(d) && selectable(d)){
            const elem = d3.select('#' + d.id)
            const fontWeight = eventType === 'mouseover' ? 'bold' : 'normal'
            elem.select('text').style('font-weight', fontWeight)
        }
    }

    static async itemSelectionChange(d){
        const card = displays.cards[d.cardID]
        this.updateItemSelection(d, card.items)

       switch(d.cardID){
            case 'enterprise':
            case 'activity':
                displayOrchestration.renderSelectionChange(card)
                //this.renderSelectorSelectionChange(card)
                //this.updateConnectors()
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

    static getItems(cardLabel){
        return selectors[cardLabel].items
    }
  

    static renderSelectorSelectionChange(card){
        if(card.items.some(item => item.selected)){
            control.contract(card)
        } else {
            control.expand(card)
        }

        selectorControl.renderItems(cardLabel)

        if(cardLabel === 'enterprise'){
            this.updateItemsSelectability('activity')
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

    

    

    static deselectOtherItems(items){
        const remainingItems = this.items.filter(item => {item.type === 'selectable', item.id !== selectedID})
        remainingItems.map(obj => ({...obj, selected: false}))
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
        const height = Math.round(cardItem.fontSize * gRatio) * 2 + cardSizing.padding * 2
        
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
            new cardLabel(this.label),
            new cardItem(this.itemLabel, true)
        ]

        this.items.forEach(item => item.parentLabel = this.label)
    }

}

class connectorControl {
    static async renderItems(id, label, itemLabel, type){

        const svg = d3.select('#' + id + 'Svg')
        
        const data = [
            new cardLabel(label),
            new cardItem(itemLabel, true)
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
            .attr('dy', cardItem.fontSize)
            
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
        if(d.constructor.name === 'cardLabel'){
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
        const x = cardSizing.padding
        const y = i * Math.round(cardItem.fontSize * 1.618) + cardSizing.padding
        return d3Helper.getTranslateString(x, y)
    }

}

class enterpriseData {  
    static getItems(){
        const items = this.createItems()
        items.forEach(item => {item.cardID = 'enterprise'})
        return items
    }

    static createItems () {
        return [
            new cardLabel ('enterprise'),
            new cardItem ('side hustle'),
            new cardItem ('construction company'),
            new cardItem ('freelance profressional')
        ]
    }

    static getSelectableItems(){
        return selectors['enterprise'].items.map(item => item.label)
    }

}

class activityData {
    static getItems (){
        const items = this.createItems()
        items.forEach(item => {item.cardID = 'activity'})
        return items
    }

    static createItems(){
        return [
            new cardLabel ('activity'),
            new cardItem ('paying employees'),
            new cardItem ('selling to enterprise'),
            new cardItem ('selling to a customer'),
            new cardItem ('starting the business'),
            new cardItem ('setting up fin mgmt systems')
        ]
    }

    static getSelectableItems(selectedEnterprise){
        let labels = []

        switch(selectedEnterprise){
            default:
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
            new cardLabel ('obligation'),
            new cardItem ('register for income tax'),
            new cardItem ('record keep for income tax'),
            new cardItem ('calculate income tax'),
            new cardItem ('report income tax'),
            new cardItem ('pay income tax'),
            new cardItem ('calculate vat'),
            new cardItem ('collect vat'),
            new cardItem ('report vat'),
            new cardItem ('pay vat'),
            new cardItem ('calculate payroll tax'),
            new cardItem ('collect payroll tax'),
            new cardItem ('report payroll tax'),
            new cardItem ('pay payroll tax'),
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
            new cardLabel ('mechanism'),
            new cardItem ('entreprenuers bank account'),
            new cardItem ('government business registry'),
        ]
    }


    static getObligationSelectableItems(obligationSelection){
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


class cardItem {

    static fontSize = 12

    constructor(label, selectable = true){
        this.label = label
        this.selectable = selectable
        this.setID()
    }

    setID(){
        this.id = this.constructor.name === 'cardLabel' ? 'label' : this.label.replaceAll(' ','')
    }

    setParentSelector(cardLabel){
        this.parentSelector = cardLabel
    }
}

class cardLabel extends cardItem {
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
