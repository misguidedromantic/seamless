const gRatio = 1.618

window.onload = function(){

/*     const calculateCardHeight = (itemCount) => {
        const itemHeight = Math.round(cardItem.fontSize * 1.618)
        return itemCount * itemHeight + cardSizing.padding * 2
    }

    const enterprises = enterpriseData.getItems()
    //const enterpriseCard = new card ('enterprise', 'enterprise', enterprises)
    const startingPosition = {top: 0, left: 0}
    const startingDimensions = {
        height: calculateCardHeight(enterprises.length),
        width: 300
    }
    const factory = new cardFactory
    factory.createCard('listBoxCard', 'enterprise', startingPosition, startingDimensions) */
    
    displayOrchestration.setup()
    displayOrchestration.initialLoad()

    function createObjectives(){
        const obligations = obligationData.getAllObligations()
        obligations.forEach(obligation => {
            obligation.mechanisms = mechanismData.getApplicableMechanisms(obligation.description)
        })
    }

    function createObjectiveCard(objective){
        const objectiveCard = new card (objective.description, 'objective', objective.mechanisms)
    }

    createObjectives()

}



function getCardsToUnload(selectedEnterprise, selectedActivity, applicableObjectives){

    const shouldUnload = (cardTitle) => {
        switch(cardTitle){
            case 'enterprise':
                return false
            case 'activity':
                return selectedEnterprise === null
            default:
                if(selectedEnterprise === null || selectedActivity === null){
                    return true
                } else if (applicableObjectives.includes(cardTitle)) {
                    return false //more criteria to add
                } else {
                    return true
                } 
                
        }
    }
    
    const loadedCards = Object.keys(displays.cards)
    const cardsToUnload = []
    
    for(i = 0; i < loadedCards.length; i++){
        const cardTitle = loadedCards[i]
        if(shouldUnload(cardTitle)){
            cardsToUnload.push(cardTitle)
        }
    }

    return cardsToUnload
    
}

function getCardsToLoad(selectedEnterprise, selectedActivity){
    if(selectedEnterprise === null){
        return null    
    }

    if(selectedActivity === null){
        return displays.cards['activity'] === undefined ? ['activity'] : null
    }


    const enterpriseObjectives = objectiveData.getObjectivesForEnterprise(selectedEnterprise.label)
    const activityObjectives = objectiveData.getObjectivesForActivity(selectedActivity.label)
    
    const enterpriseSet = new Set (activityObjectives)
    const applicableObjectives = activityObjectives.filter(element => enterpriseSet.has(element))
    
    console.log(applicableObjectives)
     
}

function updateCards (){

    const selectedEnterprise = displays.cards['enterprise'].selectedItem()
    
    const selectedActivity = displays.cards['activity'].selectedItem()

    const cardsToUnload = getCardsToUnload(selectedEnterprise, selectedActivity)
    const cardsToLoad = getCardsToLoad(selectedEnterprise, selectedActivity)
    

    //const selectedEnterprise = displays.cards['enterprise'].selectedItem()
    
    /* if(selectedEnterprise === null){
        for (const card in displays.cards){
            if(card !== 'enterprise'){
                cardsToUnload.push(card)
            }
        }
    }





    
    
    
    

    

    console.log(applicableObjectives()) */
}

class card {
    constructor(type, title){
        this.type = type
        this.title = title
    }

    

}



class orchestration {

    static selectionChange(){
        const cardsWithSelection = () => {
            const cards = []
            const cardsToCheck = Object.values(displays.cards)
            cardsToCheck.forEach(card => {
                if(this.getSelectedItem(card.items) !== null){
                    cards.push(card)
                }
            })
            return cards
        }


        const obligationsLoadable = () => {
            const checkIDs = ['enterprise', 'activity']
            for (let i = 0; i < checkIDs.length; i++){
                const cardToCheck = displays.cards[checkIDs[i]]
                if(this.getSelectedItem(cardToCheck.items) === null){
                    return false
                }
            } 

            return true
        }

        //renderItemSelectionChange
        //renderItemSelectableChanges
        //renderAvailableCardChanges
    
    }

    static updateData(){}
    static updateDisplays(){}

    static getSelectedItem(items){
        const selectedItem = items.find(item => item.selected)
        if(selectedItem === undefined){
            return null
        }
        return selectedItem
    }


}

class enterprise {

}
class activity {}

class objective {
    constructor(description){
        this.description = description
        this.id = description.replaceAll(' ','')
    }


    cardData(){
        return [
            
        ]
    }
}

class obligation extends objective {
    constructor(description){
        super(description)
    }
}


class mechanism {}

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

class selectionManager {

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

    getSelectableItems(cardID){

        let selectedEnterprise = null
        let selectedActivity = null

        switch(cardID){
            case 'activity':
                selectedEnterprise = this.getSelectedItemLabel(displays.cards['enterprise'].items)
                return activityData.getSelectableItems(selectedEnterprise)
                
            case 'enterprise':
                return null

            case 'obligations': 
                selectedEnterprise = this.getSelectedItemLabel(displays.cards['enterprise'].items)
                selectedActivity = this.getSelectedItemLabel(displays.cards['activity'].items)
                return obligationData.getSelectableItems(selectedEnterprise, selectedActivity)
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


}



class cardEvents {

    static onItemHover(event, d){
        displayOrchestration.mouseoverItem(d)
    }
    
    static onItemOff(event, d){
        displayOrchestration.mouseOffItem(d)
    }
    
    static onItemClick(event, d){
        displayOrchestration.itemClicked(d)
    }

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

    static initialLoad(){
        const cardTitles = ['Enterprise','Activity']
        const cards = this.createCards('listBoxCard', cardTitles)
        this.loadCards(cards)
    }

    static createCards(cardType, cardTitles){
        const created = []
        
        for(let i = 0; i < cardTitles.length; i++){
            const position = cardPositioning.calculatePreEntryPosition(cardType, cardTitles[i])
            const dimensions = cardSizing.calculateStartingDimensions()
            const card = this.#factory.createCard(cardType, cardTitles[i], position, dimensions)
            created.push(card)
            displays.addCard(card)
        }

        return created
    }

    static async loadCards(cardsToLoad){
        for(let i = 0; i < cardsToLoad.length; i++){
            await this.#cardControl.load(cardsToLoad[i])
        }

        return Promise.resolve()
    }

    static async unloadCard(cardID){
        const card = displays.cards[cardID]
        await this.#cardControl.unload(card)
        card.div.remove()
        delete displays.cards[cardID]
        return Promise.resolve()
    }

    static mouseoverItem(item){
        const isCardItem = (item) => item.constructor.name === 'cardItem'
        if(isCardItem(item)){this.#cardControl.mouseoverItem(item)}
    }

    static mouseOffItem(item){
        const isCardItem = (item) => item.constructor.name === 'cardItem'
        if(isCardItem(item)){this.#cardControl.mouseOffItem(item)}
    }

    static async itemClicked(item){
        const clickedCard = displays.cards[item.cardID]
        this.#selectionManager.updateItemSelection(item.id, clickedCard.items)

/*         if(clickedCard.constructor.name === 'listBoxCard'){
            this.#selectionManager.updateItemSelection(item.id, clickedCard.items)
            await this.#cardControl.renderSelectionChange(clickedCard)
            this.updateSelectableState()
            await this.refresh()
        } else if (clickedCard.constructor.name === 'optionCard'){
            this.#selectionManager.updateItemSelection(item.id, clickedCard.items)
        } */

        updateCards()
        //orchestration.selectionChange()

    }

    static updateSelectableState(){
        const cardArray = Object.values(displays.cards)

        for(let i = 0; i < cardArray.length; i++){
            const card = cardArray[i]
            const selectableItemLabels = this.#selectionManager.getSelectableItems(card.id)
            if(selectableItemLabels !== null && card.constructor.name === 'listBoxCard'){
                this.#cardControl.renderSelectabilityChange(card, selectableItemLabels)
            }
        }
    }

    static async refresh(){
        const cardTitlesToLoad = this.#selectionManager.getSelectableItems('obligations')
        const cardsIDsToUnload = this.getCardsToUnload(cardTitlesToLoad)
        await this.unloadCards(cardsIDsToUnload)
        const cards = this.createCards('optionCard', cardTitlesToLoad)
        await this.loadCards(cards)
        return Promise.resolve()
    }

    static getCardsToUnload(titlesToDisplay){
        const optionCards = Object.values(displays.cards).filter(card => card.constructor.name === 'optionCard')
        const ids = []

        optionCards.forEach(card => {
            if(!titlesToDisplay.includes(card.title)){
                ids.push(card.id)
            }
        })

        return ids
    }

    static async unloadCards(cardIds){
        for(let i = 0; i < cardIds.length; i++){
            this.unloadCard(cardIds[i])
        }
        return Promise.resolve()
    }
}

class listBoxCard {
    maxVisibleItems = 6
    left = 0
    top = 0
    constructor(title){
        this.title = title
        this.id = this.title.toLowerCase().replaceAll(' ','')
    }

    selectedItem(){
        const foundItem = this.items.find(item => item.selected)
        return foundItem === undefined ? null : foundItem
    }

}
class optionCard {
    maxVisibleItems = 2
    constructor(title){
        this.title = title
        this.id = this.title.toLowerCase().replaceAll(' ','')
    }
}

class cardHolder {
    static cards = {}

    static add(card){
        this.cards[card.id] = card
    }

}

class cardPositioning {
    static calculatePreEntryPosition(cardType, cardTitle){
        const pos = {}
        if(cardType === 'listBoxCard'){
            pos.left = this.calculateLeft(cardType, cardTitle)
        } else if (cardType === 'optionCard'){
            pos.left = -300
        }
        pos.top = this.calculateTop(cardType, cardTitle)
        return pos

    }

    static calculateStartingPosition(cardType, cardTitle){
        const pos = {}
        pos.left = this.calculateLeft(cardType, cardTitle)
        pos.top = this.calculateTop(cardType, cardTitle)
        return pos
    }

    static calculateRemovalPosition(card){
        const pos = {}
        if (card.constructor.name === 'optionCard'){
            pos.top = this.getCardTopValue(card)
            pos.left = -300
        }
        return pos

    }

    static calculateLeft(cardType, cardTitle){
        const cardToLeft = this.getCardToLeft(cardType, cardTitle)
        const startLeft = this.getCardLeftValue(cardToLeft)
        const width = cardSizing.getWidth(cardToLeft)
        return startLeft + width + cardSizing.padding 
    }

    static calculateTop(cardType, cardTitle){
        const cardAbove = this.getCardAbove(cardType, cardTitle)
        const startTop = this.getCardTopValue(cardAbove)
        const height = cardSizing.getHeight(cardAbove)
        return startTop + height + cardSizing.padding
    }

    static getCardLeftValue(card){
        try{
            const stringLeft = d3.select('#' + card.id + 'Div').style('left')
            return parseInt(stringLeft.slice(0, stringLeft.indexOf('px')))
        } catch {
            return 0
        }
        
    }

    static getCardTopValue(card){
        try{
            const stringTop = d3.select('#' + card.id + 'Div').style('top')
            return parseInt(stringTop.slice(0, stringTop.indexOf('px')))
        } catch {
            return 0
        }
    }

    static getCardToLeft(cardType, cardTitle){ 
        if(cardType === 'listBoxCard'){
            switch(cardTitle){
                case 'Enterprise':
                    return null;
                case 'Activity':
                    return displays.cards['enterprise']
            }
        } else if (cardType === 'optionCard'){
            return null;
        }
    }


    static getCardAbove(cardType, cardTitle){
        if(cardType === 'listBoxCard'){
            return null
        } else if (cardType === 'optionCard'){
            const cardArray = Object.values(displays.cards)
            const i = cardArray.findIndex(card => card.title === cardTitle)
            const cardAbove = i === -1 ? cardArray[cardArray.length - 1] : cardArray [i - 1]
            return cardAbove
            
        }
    }
}

class cardSizing {
    static padding = 15

    static calculateStartingDimensions(cardType){
        const itemCount = cardType === 'listBoxCard' ? 6 : 2
        return {
            width: 300,
            height: this.calculateCardHeight(itemCount)
        }
    }
    
    static getWidth(card){
        try{
            const stringWidth = d3.select('#' + card.id + 'Div').style('width')
            return parseInt(stringWidth.slice(0, stringWidth.indexOf('px')))
        } catch {
            return 0
        }
    }

    static getHeight(card){
        try{
            const stringHeight = d3.select('#' + card.id + 'Div').style('height')
            return parseInt(stringHeight.slice(0, stringHeight.indexOf('px')))
        } catch {
            return 0
        }
        
    }

    static calculateCardHeight (itemCount){
        const itemHeight = Math.round(cardItem.fontSize * 1.618)
        return itemCount * itemHeight + cardSizing.padding * 2
    }
    
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

    createCard(type, title, position, dimensions){
        const card = this.#createObject(type, title)
        this.#addDiv(card, position, dimensions)
        this.#addSvg(card)
        return card
    }
    
    #createObject(type, title){
        switch(type){
            case 'listBoxCard':
                return new listBoxCard(title)
            case 'optionCard':
                return new optionCard(title)
            default:
                return new card(type, title)
        }
    }

    #addDiv(card, position, dimensions){
        card.div = d3.select('body')
            .append('div')
            .attr('id', card.id + 'Div')
            .style('position', 'absolute')
            .style('left', position.left + 'px')
            .style('top', position.top + 'px')
            .style('width', dimensions.width + 'px')
            .style('height', dimensions.height + 'px')
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

        let position = {}
        
        switch(card.constructor.name){
            case 'listBoxCard':
                position = cardPositioning.calculateStartingPosition('listBoxCard', card.title)
                this.dynamics.move(card, position)
                return this.dynamics.emerge(card)
            case 'optionCard':
                position = cardPositioning.calculateStartingPosition('optionCard', card.title)
                await this.dynamics.emerge(card)
                return this.dynamics.move(card, position, 300)
        }
        
    }

    unload(card){
        const position = cardPositioning.calculateRemovalPosition(card)
        return this.dynamics.move(card, position, 300)
    }

    mouseoverItem(item){
        const selectable = (item)=> item.selectable
        const selected = (item) => item.selected

        if(selectable(item) && !selected(item)){
            this.updateFontWeight(item.id, 'bold')
        } 
    }

    mouseOffItem(item){
        const selectable = (item)=> item.selectable
        const selected = (item) => item.selected
        if(selectable(item) && !selected(item)){
            this.updateFontWeight(item.id, 'normal')
        } 
    }

    updateFontWeight(itemID, fontWeight){
        const elem = d3.select('#' + itemID)
        elem.select('text').style('font-weight', fontWeight)
    }


    async renderSelectionChange(card){
        this.contentDynamics.renderItems(card)
        if(card.constructor.name === 'listBoxCard'){
            await this.resizeOnSelectionChange(card)
        }
    }

    async resizeOnSelectionChange(card){
        if(card.items.some(item => item.selected)){
            await this.dynamics.contract(card, 300)
        } else {
            await this.dynamics.expand(card, 300)
        }

        return Promise.resolve()
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

    emerge(card, duration = 0){
        this.setWidth(card)
        
        return card.div.transition()
            .duration(duration)
            .ease(d3.easeCubicIn)
                .style('background-color', 'white')
                .style('box-shadow', '5px 5px 10px rgba(0, 0, 0, 0.3)')
            .end()
    }

    setWidth(card){
        const width = cardSizing.calculateCardWidth(card.id)
        card.div.style('width', width + 'px')
        card.svg.style('width', width)
    }

    expand(card, duration = 0){
        const calculateHeight = (itemCount) => {
            const itemHeight = Math.round(cardItem.fontSize * 1.618)
            return itemCount * itemHeight + cardSizing.padding * 2
        }

        const divHeight = calculateHeight(card.maxVisibleItems)
        const svgHeight = calculateHeight(card.items.length)

        card.svg.style('height', svgHeight)
        return card.div.transition()
            .duration(duration)
                .style('height', divHeight + 'px')
            .end()

        
    }

    move(card, coordinates, duration = 0){
        return card.div.transition()
            .duration(duration)
                .style('top', coordinates.top + 'px')
                .style('left', coordinates.left + 'px')
            .end()
    }

    contract(card, duration = 0){
        const calculateHeight = (itemCount) => {
            const itemHeight = Math.round(cardItem.fontSize * 1.618)
            return itemCount * itemHeight + cardSizing.padding * 2
        }


        const divHeight = calculateHeight(2)
        const svgHeight = calculateHeight(card.items.count)

        card.svg.style('height', svgHeight)

        return card.div.transition()
            .duration(duration)
                .style('height', divHeight + 'px')
            .end()

    
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
            .on('mouseover', (event, d) => cardEvents.onItemHover(event, d))
            .on('mouseout', (event, d) => cardEvents.onItemOff(event, d))
            .on('click', (event, d) => cardEvents.onItemClick(event, d))

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
    getOptionCardData(title){
        console.log(title)
        const obligations = obligationData.getItems() 
        const items = []
                items.push(obligations.find(item => item.label === 'obligation'))
                items.push(obligations.find(item => item.label === title))
                return items

    }





    getCardData(title){
        switch(title){
            case 'Enterprise':
                return enterpriseData.getItems()
            case 'Activity':
                return activityData.getItems()
            default:
                return this.getOptionCardData(title)
        }
    }
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

class objectiveData {
    static getObjectivesForEnterprise(enterprise){
        const labels = []
        switch(enterprise){
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

    static getObjectivesForActivity(activity){
        const labels = []
        switch(activity){
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

class obligationData {

    static getAllObligations(){
        return [
            new obligation ('register for income tax'),
            new obligation ('record keep for income tax'),
            new obligation ('calculate income tax'),
            new obligation ('report income tax'),
            new obligation ('pay income tax'),
            new obligation ('calculate vat'),
            new obligation ('collect vat'),
            new obligation ('report vat'),
            new obligation ('pay vat'),
            new obligation ('calculate payroll tax'),
            new obligation ('collect payroll tax'),
            new obligation ('report payroll tax'),
            new obligation ('pay payroll tax'),
        ]

    }

    static getItems (){
        const items = this.createItems()
        items.forEach(item => {item.cardID = item.id})
        return items
    }

    static createItems(){
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



    static getSelectableItems (selectedEnterprise, selectedActivity){
        const itemsEnterprise = this.getEnterpriseSelectableItems(selectedEnterprise)
        const itemsActivity = this.getActivitySelectableItems(selectedActivity)
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

    static getApplicableMechanisms(objectiveDescription){
        const mechanisms = []
        switch(objectiveDescription){
            case 'calculate income tax':
            case 'report income tax': 
            case 'pay income tax':
                mechanisms.push('entreprenuers bank account')
                break;
            case 'register for income tax':
                mechanisms.push('entreprenuers bank account')
                mechanisms.push('government business registry')
            break;
        }
        return mechanisms
    }

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




class d3Helper {
    static getTranslateString(x, y){
        return "translate(" + x + "," + y + ")"
    }
}
