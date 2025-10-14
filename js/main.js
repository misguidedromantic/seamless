const gRatio = 1.618

window.onload = async function(){
    loadAggregator()
    //orchestration.setup()
    //orchestration.loadDefaultView()
}

function loadAggregator(){
    const card = createAggregator()
    configureTextAggregator(card)
    positionAggregatorForReveal(card)
    revealAggregator(card)
}

function createAggregator(){
    const factory = new cardFactory
    return factory.createCard('textAggregatorCard', 'user story')
}

function configureTextAggregator(card){
    const sizing = new cardsSizing
    const dynamics = new cardDynamics
    const dimensions = sizing.calculateDimensions(card)
    card.height = dimensions.height
    card.width = dimensions.width
    card.visible = false
    dynamics.resize(card, dimensions, 0)
}

function positionAggregatorForReveal(card){
    const dynamics = new cardDynamics
    const position = {left: 15, top: 15}
    dynamics.move(card, position, 0)
}

function revealAggregator(card){
    const dynamics = new cardDynamics
    dynamics.emerge(card, 500)
    card.div.style('background', 'red')
    card.svg.append('text').text('As a ').style('fill', 'black').attr('dy', 25).attr('dx', 25)
}


class orchestration {

    static #cardsController = {}

    static setup(){
        this.#cardsController = new cardsController
    }

    static loadDefaultView(){
        this.#cardsController.refresh()
    }

    static getScreenDimensions(){
        return {
            width: window.innerWidth,
            height: window.innerWidth,
        }
    }

    static handleCardItemClick(event, d){
        this.#cardsController.manageItemClick(d)
    }

    static handleCardItemHovering(event, d){
        if(event.type === 'mouseover'){
            this.#cardsController.manageItemMouseOver(d)
        } else if (event.type === 'mouseout'){
            this.#cardsController.manageItemMouseOut(d)
        }
    }
}

class cardsController {
    #stateManager = []
    #layoutManager = {}
    #factory = {}
    #controller = {}

    constructor(){
        this.#stateManager = new cardsStateManager
        this.#layoutManager = new cardsLayoutManager
        this.#factory = new cardFactory
        this.#controller = new cardController
    }

    refresh(){
        const requiredActions = this.#stateManager.getRequiredLoadingActions()
        if(requiredActions.toUnload.length > 0){
            this.unloadCards(requiredActions.toUnload)
        }

        if(requiredActions.toUpdate.length > 0){
            this.updateCards(requiredActions.toUpdate)
        }

        if(requiredActions.toLoad.length > 0){
            this.loadCards(requiredActions.toLoad)
        }
    }

    loadCards(titles){
        this.#createCards(titles)
        this.#setupCards(this.#stateManager.getCardsToLoad(titles))
        this.#displayCards(this.#stateManager.getCardsToLoad(titles))
    }

    unloadCards(cards){
        this.#hideCards(cards)
        this.#removeCards(cards)
    }

    updateCards(cards){
        const allCards = this.#stateManager.getAllCards()
        this.#layoutManager.arrange(cards, allCards)
        for(const card of cards){
            this.#controller.renderSelectionChange(card)
        }
        
    }

    async manageItemClick(clickedItem){
        this.#stateManager.updateCardItemsSelectionState(clickedItem)
        this.refresh()
    }


    renderColourChange(itemType, itemID, colour){
        if(itemType === 'cardTag'){
            this.#controller.updateRectFill(itemID, colour)
        } else if (itemType === 'item'){
            this.#controller.updateTextFill(itemID, colour)
        }
    }

    highlightLinkedItems(items){
        const colour = 'gold'
        for(const item of items){
            this.renderColourChange(item.constructor.name, item.id, colour)
        }
    }

    unHighlightLinkedItems(items){
        let colour = undefined
        for(const item of items){
            colour = item.constructor.name === 'cardTag' ? 'grey' : '#131C3E'
            this.renderColourChange(item.constructor.name, item.id, colour)
        }
    }


    manageItemMouseOver(item){
        if(this.#stateManager.isLinkedItem(item)){
            const linkedItems = this.#stateManager.getLinkedItems(item)
            this.highlightLinkedItems(linkedItems)
        } else if(item.constructor.name === 'item'){
            this.#controller.updateFontWeight(item.id, 'bold')
        }
    }

    manageItemMouseOut(item){
        if(this.#stateManager.isLinkedItem(item)){
            const linkedItems = this.#stateManager.getLinkedItems(item).filter(item => !item.selected)
            this.unHighlightLinkedItems(linkedItems)
        } else if(item.constructor.name === 'item'){
            this.#controller.updateFontWeight(item.id, 'normal')
        }
    }


    #createCards(titles){
        for (const title of titles) {
            const type = this.#stateManager.getCardTypeForTitle(title)
            this.#stateManager.addCard(title, this.#factory.createCard(type, title))
            if(type === 'optionCard'){
                const card = this.#stateManager.getCard(title)
                card.previousCard = this.#stateManager.getPreviousOptionCardTitle(title)
            }
        }
    }

    #setupCards(cards){
        const allCards = this.#stateManager.getAllCards()
        this.#stateManager.setCardItems(cards)
        this.#layoutManager.arrange(cards, allCards) 
    }

    async #displayCards(cards){
        for (const card of cards){
            this.#controller.renderContent(card)
        }
    }

    #hideCards(cards){
        for (const card of cards){
            card.items = []
            this.#controller.renderContent(card)
        }
    }

    #removeCards(cards){
        for (const card of cards){
            card.div.remove()
            this.#stateManager.removeCard(card.title)
        }
    }



}

class cardsLayoutManager {

    static verticalGap = 15
    static horizontalGap = 15

    #controller = {}
    #positioning = {}
    #sizing = {}
    #stateManager = {}

    constructor(){
        this.#sizing = new cardsSizing
        this.#positioning = new cardsPositioning
        this.#stateManager = new cardsStateManager
        this.#controller = new cardController
    }

    getLayout(){
        return {
            storyWriter: {row: 1, col: 1, colsWide: 2},
            enterpriseSelector: {row: 2, col: 1, colsWide: 1},
            activitySelector: {row: 2, col: 2, colsWide: 1},


        }

    }

    arrange(cardsToArrange, allCards){
        this.#setSizes(cardsToArrange)
        this.#setGridPositions(cardsToArrange, allCards)
        this.#renderStatic(cardsToArrange)
    }

    #setSizes(cards){
        for (const card of cards){
            const dimensions = this.#sizing.calculateDimensions(card)
            this.#stateManager.setCardSize(card, dimensions)
        }
    }

    #setGridPositions(cardsToPosition, allCards){
        for (const card of cardsToPosition){
            const cardToLeft = this.#getCardToLeft(card, allCards)
            const cardAbove = this.#getCardAbove(card, allCards)
            const coordinates = this.#positioning.calculateCoordinates(cardToLeft, cardAbove)
            this.#stateManager.setCardPosition(card, coordinates)
        }
    }

    #getCardToLeft(thisCard, allCards){
        if(thisCard.title === 'enterprise'){
            return null
        } else if (thisCard.title === 'activity'){
            return allCards.find(card => card.title === 'enterprise')
        } else if (thisCard.title === 'mechanism'){
            return allCards.find(card => card.title === 'enterprise')
        } else {
            return null 
        }
    }
    
    #getCardAbove(thisCard, allCards){
        if(thisCard.title === 'enterprise'){
            return null
        } else if (thisCard.title === 'activity'){
            return null
        } else if (thisCard.title === 'mechanism'){
            return allCards.find(card => card.title === 'activity')
        } else {
            return allCards.find(card => card.title === thisCard.previousCard)
        }
    }

    #renderStatic(cards){
        for (const card of cards){
            this.#controller.renderPositionChange(card)
            this.#controller.renderSizeChange(card)
        }
    }
}

class cardsSizing {

    constructor(){
        this.aspectRatio = 9 / 16
    }

    calculateDimensions(card){
        if(card.constructor.name === 'listBoxCard'){
            return {
                width: this.#calculateStandardWidth(),
                height: this.#calculateListBoxHeight(card)
            }
        } else if (card.constructor.name === 'optionCard'){
            return {
                width: this.#calculateStandardWidth(),
                height: this.#calculateOptionCardHeight()
            }
        } else if (card.constructor.name === 'textAggregatorCard'){
            return {
                width: this.#calculateTextAggregatorWidth(),
                height: this.#calculateTextAggregatorHeight()
            }
        }
    }

    #calculateStandardWidth(){
        const screenWidth = orchestration.getScreenDimensions().width
        
        if(screenWidth < 600){
            return (screenWidth - (3 * cardsLayoutManager.horizontalGap)) / 2
        } else {
            return (screenWidth / gRatio - 4 * cardsLayoutManager.horizontalGap) / 2
        }
    }

    #calculateListBoxHeight(card){
        if(card.selectedItem() !== null && card.title !== 'mechanism'){
            return 4 * cardItem.fontSize  
        } else {
            return (card.items.length + 2) * cardItem.fontSize
        }
    }

    #calculateOptionCardHeight(){
        return 4 * cardItem.fontSize
    }

    #calculateTextAggregatorWidth(){
        const screenWidth = orchestration.getScreenDimensions().width
        if(screenWidth < 600){
            return (screenWidth - (2 * cardsLayoutManager.horizontalGap))
        } else {
            return (screenWidth / gRatio - 2 * cardsLayoutManager.horizontalGap)
        }
    }

    #calculateTextAggregatorHeight(){
        return 250
    }

}

class cardsPositioning {

    constructor(){
        this.verticalGap = 15
        this.horizontalGap = 15
    }

    calculateCoordinates(cardToLeft, cardAbove){
        return {
            left: this.#calculateLeft(cardToLeft),
            top: this.#calculateTop(cardAbove)
        }
    }

    #calculateLeft(cardToLeft){
        if (cardToLeft !== null){
            return cardToLeft.left + cardToLeft.width + this.horizontalGap
        } else {
            return this.horizontalGap
        }
    }

    #calculateTop(cardAbove){
        if (cardAbove !== null){
            return cardAbove.top + cardAbove.height + this.verticalGap
        } else {
            return this.verticalGap
        }
    }

}

class cardsStateManager {
    #dataHandler = {}
    #controller = {}

    constructor() {
        this.cards = new Map()
        this.#dataHandler = new cardsDataHandler
        this.#controller = new cardController
    }

    addCard(title, obj){
        this.cards.set(title, obj)
    }

    getAllCards(){
        return Array.from(this.cards.values())
    }

    getCard(title){
        return this.cards.get(title)
    }

    getCardByID(id){
        const cards = this.getAllCards()
        return cards.find(card => card.id === id)
    }

    getCardTypeForTitle(title){
        switch(title){
            case 'enterprise':
            case 'activity':
            case 'mechanism':
                return 'listBoxCard'
            default:
                return 'optionCard'
        }
    }

    setCardSize(card, dimensions){
        card.width = dimensions.width
        card.height = dimensions.height
    }

    setCardPosition(card, coordinates){
        card.left = coordinates.left
        card.top = coordinates.top
    }

    setCardItems(cards){
        for (const card of cards) {
            if(card.constructor.name === 'listBoxCard'){
                card.items = this.#dataHandler.prepareItemsForListBoxCard(card)
            } else if (card.constructor.name === 'optionCard'){
                card.items = this.#dataHandler.prepareItemsForOptionCard(card)
            }

        }
    }

    removeCard(id){
        this.cards.delete(id)
    }


    updateLinkedItemSelections(clickedItem){
        const linkedItems = this.getLinkedItems(clickedItem)
        if(clickedItem.selected){
            linkedItems.forEach(item => item.selected = false)
        } else {
            linkedItems.forEach(item => item.selected = true)
        }
    }

    updateStandardItemSelections(clickedItem){
        if (clickedItem.selectable && !clickedItem.selected){
            clickedItem.selected = true
            this.deselectOtherItems(clickedItem)
        } else {
            clickedItem.selected = false
        }
    }


    deselectOtherItems(clickedItem){
        const card = this.cards.get(clickedItem.cardID)
        const toDeselect = card.items.filter(item => item.selectable && item.selected && item !== clickedItem)
        toDeselect.forEach(item => item.selected = false)
    }


    updateCardItemsSelectionState(clickedItem){
        if(this.isLinkedItem(clickedItem)){
            this.updateLinkedItemSelections(clickedItem)
        } else {
            this.updateStandardItemSelections(clickedItem)
        }
    }

    

    getRequiredLoadingActions(){
        const visibleCards = this.getAllCards()
        const shouldBeVisibleCards = this.getRequiredVisiblityStates()

        return {
            toUnload: this.getCardsToUnload(visibleCards, shouldBeVisibleCards),
            toLoad: this.getCardsToCreate(visibleCards, shouldBeVisibleCards),
            toUpdate: this.getCardsToUpdate(visibleCards, shouldBeVisibleCards)
        }

    }

    getCardsToLoad(titles){
        const cardsToLoad = []
        for(const title of titles){
            cardsToLoad.push(this.getCard(title))
        }
        return cardsToLoad
    }

    getCardsToCreate(visibleCards, shouldBeVisibleCards){
        const toLoad = []
        for(const cardTitle of shouldBeVisibleCards){
            if(!visibleCards.some(card => card.title === cardTitle)){
                toLoad.push(cardTitle)
            }
        }
        return toLoad
    }

    getCardsToUpdate(visibleCards, shouldBeVisibleCards){
        const toUpdate = []
        for(const card of visibleCards){
            if(shouldBeVisibleCards.includes(card.title)){
                toUpdate.push(card)
            }
        }
        return toUpdate
    }


    getCardsToUnload(visibleCards, shouldBeVisibleCards){
        const toUnload = []
        for(const card of visibleCards){
            if(!shouldBeVisibleCards.includes(card.title)){
                toUnload.push(card)
            }
        }
        return toUnload
    }


    getRequiredVisiblityStates(){
        let shouldBeVisible = this.getVisibleCardsFromEnterpriseState()

        const optionCardsToAdd = shouldBeVisible.includes('activity') ? this.getVisibleCardsFromActivityState() : null
        if(optionCardsToAdd !== null){
            shouldBeVisible = [...shouldBeVisible, ...optionCardsToAdd]
            shouldBeVisible.push('mechanism')
        }

        return shouldBeVisible
    }

    getVisibleCardsFromEnterpriseState(){
        const enterpriseCard = this.cards.get('enterprise')
        if(enterpriseCard === undefined){
            return ['enterprise']
        }

        const selectedEnterprise = enterpriseCard.selectedItem()
        
        if(selectedEnterprise === null){
            return ['enterprise']
        } else {
            return ['enterprise', 'activity']
        }
    }

    getVisibleCardsFromActivityState(){
        const activityCard = this.cards.get('activity')
        if(activityCard === undefined){
            return null
        }
        
        const selectedActivity = activityCard.selectedItem()

        if(selectedActivity === null){
            return null
        } else {
            const enterpriseCard = this.cards.get('enterprise')
            const selectedEnterprise = enterpriseCard.selectedItem()
            return this.getApplicableObjectivies(selectedEnterprise, selectedActivity)
        }
            
    }

    getApplicableObjectivies(selectedEnterprise, selectedActivity){
        const enterpriseObjectives = objectiveData.getObjectivesForEnterprise(selectedEnterprise.label)
        const activityObjectives = objectiveData.getObjectivesForActivity(selectedActivity.label)
        const enterpriseSet = new Set (enterpriseObjectives)
        return activityObjectives.filter(element => enterpriseSet.has(element))
    }

    getPreviousOptionCardTitle(title){
        const optionCards = this.getAllCards().filter(card => card.constructor.name === 'optionCard')
        
        for (let i = 0; i < optionCards.length; i++){
            const thisOptionCard = optionCards[i]
            if(thisOptionCard.title === title){
                const prevCard = optionCards[i - 1]
                return prevCard === undefined ? 'enterprise' : prevCard.title
            }
            
        }
    }

    getLinkedItems(thisItem){
        const optionCards = this.getAllCards().filter(card => card.constructor.name === 'optionCard')
        let linkedItems = []
        
        if(thisItem.constructor.name === 'cardTag'){
            const mechanismCard = this.getCard('mechanism')
            linkedItems.push(mechanismCard.items.find(item => item.label === thisItem.label))
        } else if(thisItem.cardID === 'mechanism') {
            linkedItems.push(thisItem)
        } 

        for(const card of optionCards){
            const linkedItem = card.items.find(item => item.label === thisItem.label)
            if(linkedItem !== undefined){
                linkedItems.push(linkedItem)
            }
        }

        return linkedItems
    }

    isLinkedItem(item){
        const selectable = item.selectable
        const onMechansimCard = item.cardID === 'mechanism'
        const isTag = item.constructor.name === 'cardTag'
        return selectable && (onMechansimCard || isTag)
    }





}

class cardsDataHandler {

    prepareItemsForListBoxCard(card){
        const data = this.getContentDataForCard(card.title)
        return [
            ...[new title (card.title)],
            ...data.map(d => new item (d, card))
        ]
    }

    prepareItemsForOptionCard(card){
        const data = this.getContentDataForCard(card.title)
        const obligations = data.filter(d => d.constructor.name === 'obligation').map(d => new item(d, card))
        const mechanisms = data.filter(d => d.constructor.name === 'mechanism').map(d => new cardTag(d, card))

        const thisObligation = obligations[0]

        return [
            ...obligations,
            ...[new subTitle (thisObligation.concept, card)],
            ...mechanisms
        ]
    }



    getContentDataForCard(title){
        let data = []
        switch(title){
            case 'enterprise':
                data = dataHandler.getEnterprises()
                return data.map(d => new enterprise (d))
            case 'activity':
                data = dataHandler.getActivities()
                return data.map(d => new activity (d))
            case 'mechanism':
                data = dataHandler.getMechanisms()
                return data.map(d => new mechanism (d))
            default:
                return dataHandler.getOptionCardData(title)
        }
    }
}

class title {
    constructor(concept){
        this.id = this.getID(concept)
        this.label = this.getLabel(concept)
    }

    getLabel(concept){
        return concept.charAt(0).toUpperCase() + concept.slice(1)
    }

    getID(concept){
        return concept.replace(' ','') + 'Title'
    }
}

class subTitle {
    constructor(concept, card){
        this.id = this.getID(card.title, concept)
        this.label = concept
    }

    getID(cardID, label){
        return cardID + label.replaceAll(' ','')
    }
}

class item {

    constructor (object, card) {
        this.label = object.description
        this.concept = object.constructor.name
        this.cardID = card.id
        this.id = this.getID(card.id, object.description)
        this.selectable = true
    }

    getID(cardID, label){
        return cardID + label.replaceAll(' ','')
    }


}

class cardTag extends item {
    constructor(object, card){
        super(object, card)
    }
}

class enterprise {
    constructor(description){
        this.description = description
    }
}

class activity {
    constructor(description){
        this.description = description
    }
}

class obligation {
    constructor(description){
        this.description = description
    }
}

class mechanism {
    constructor(description){
        this.description = description
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
            case 'textAggregatorCard':
                return new textAggregatorCard(title)
            default:
                return new card(type, title)
        }
    }

    #addDiv(card){
        card.div = d3.select('body')
            .append('div')
            .attr('id', card.id + 'Div')
            .style('position', 'absolute')
            .style('border-radius', '10px')
            .style('background-color', '#F6F7F9')
            .style('box-shadow', '0px 0px 0px rgba(0, 0, 0, 0)')
    }

    #addSvg(card){
        card.svg = card.div.append('svg')
            .attr('id', card.id + 'Svg')
    }

}

class textAggregatorCard {
    constructor(title){
        this.title = title
        this.id = this.title.toLowerCase().replaceAll(' ','')
    }
}

class cardController {
    #dynamics = {}
    #contentDynamics = {}

    constructor(){
        this.#dynamics = new cardDynamics
        this.#contentDynamics = new cardContentDynamics
    }

    renderPositionChange(card, animate = false){
        const duration = animate ? 350 : 0
        const coordinates = {left: card.left, top: card.top,}
        return this.#dynamics.move(card, coordinates, duration)
    }

    renderSizeChange(card, animate = false){
        const duration = animate ? 350 : 0
        const dimensions = {width: card.width, height: card.height}
        return this.#dynamics.resize(card, dimensions, duration)
    }

    renderContent(card){
        if(card.constructor.name === 'listBoxCard'){
            this.#dynamics.emerge(card, 300)
            this.#contentDynamics.renderItems(card, 300)
        } else if (card.constructor.name === 'optionCard'){
            this.#dynamics.emerge(card, 300)
            this.#contentDynamics.renderItems(card, 300)
        }
    }

    async renderSelectionChange(card){
        await this.#contentDynamics.renderItems(card, 300)
        this.renderSizeChange(card, true)
    }

    updateFontWeight(itemID, fontWeight){
        const elem = d3.select('#' + itemID)
        elem.select('text').style('font-weight', fontWeight)
    }

    updateTextFill(itemID, fill){
        const elem = d3.select('#' + itemID)
        elem.select('text').style('fill', fill)
    }

    updateRectFill(itemID, fill){
        const elem = d3.select('#' + itemID)
        elem.select('rect').attr('fill', fill)
    }
}

class cardSizing {

    static padding = 15
    
    static calculateStartingDimensions(card){

        let itemCount = undefined

        if(card.title === 'mechanism'){
            itemCount = card.items.length
        } else if (card.constructor.name === 'listBoxCard') {
            itemCount = 6
        } else {
            itemCount = 2
        }
        
        return {
            width: 300,
            height: this.calculateCardHeight(itemCount)
        }
    }

    static calculateUpdateDimensions(){}
    
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
        return (itemCount + 1) * cardItem.fontSize
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

function getLoadActions (requiredStates, requiredActions){
    const cardLoaded = (cardTitle) => {
        const loadedCard = displays.cards[cardTitle]
        return loadedCard === undefined ? false : true
    }

    function assignLoadKeepActions (shouldBeLoaded, requiredActions){
        for (let i = 0; i < shouldBeLoaded.length; i++){
            const title = shouldBeLoaded[i]
            if(!cardLoaded(title)){
                requiredActions.load.push(title)
            } else {
                requiredActions.update.push(title)
            }
        }
    }

    function assignUnloadActions (shouldntBeLoaded, requiredActions){
        for (let i = 0; i < shouldntBeLoaded.length; i++){
            requiredActions.unload.push(shouldntBeLoaded[i])
        }
    }

    assignLoadKeepActions(requiredStates.loaded, requiredActions)
    assignUnloadActions(requiredStates.unloaded, requiredActions)

}

async function createAndUpdate(actions, shouldBeLoaded){

    

    const getPrevTitle = (cardTitle, shouldBeLoaded) => {
        const i = shouldBeLoaded.findIndex(title => title === cardTitle)
        return shouldBeLoaded[i - 1]
    }

    for (let i = 0; i < shouldBeLoaded.length; i++){
        const title = shouldBeLoaded[i]
        const prevTitle = getPrevTitle(title, shouldBeLoaded)
        
        if(actions.load.includes(title)){
            await displayOrchestration.createCard(title, prevTitle)
        } else if (actions.update.includes(title)) {
            await displayOrchestration.updateCard(title, prevTitle)
        }
    }

    return Promise.resolve()

}

async function finaliseLoad(cardsToLoad){
    for (let i = 0; i < cardsToLoad.length; i++){
        const cardToLoad = displays.cards[cardsToLoad[i]]
        await displayOrchestration.loadCard(cardToLoad)
    }

    return Promise.resolve()
}

async function executeLoadUpdateActions (actions, shouldBeLoaded){
    await createAndUpdate(actions, shouldBeLoaded)
    await finaliseLoad(actions.load)
    return Promise.resolve()
}

async function executeUnloadActions (cardsToUnload){
    for (let i = 0; i < cardsToUnload.length; i++){
        const title = cardsToUnload[i]
        await displayOrchestration.unloadCard(title)
        
    }

    return Promise.resolve()
}

async function updateCards (){

    const cardLoaded = (cardTitle) => {
        const loadedCard = displays.cards[cardTitle]
        return loadedCard === undefined ? false : true
    }

    const requiredLoadStates = {
        loaded: [],
        unloaded: []
    }

    const requiredActions = {
        load: [],
        update: [],
        unload: []
    }


    function getRequiredStatesFromEnterpriseCard(requiredStates){
        requiredStates.loaded.push('enterprise')
        const selectedEnterprise = displays.cards['enterprise'].selectedItem()
        selectedEnterprise === null ? requiredStates.unloaded.push('activity') : requiredStates.loaded.push('activity')
    }

    function getRequiredStatesFromActivityCard(requiredStates){

        function getApplicableObjectivies(selectedEnterprise, selectedActivity){
            const enterpriseObjectives = objectiveData.getObjectivesForEnterprise(selectedEnterprise.label)
            const activityObjectives = objectiveData.getObjectivesForActivity(selectedActivity.label)
            const enterpriseSet = new Set (enterpriseObjectives)
            return activityObjectives.filter(element => enterpriseSet.has(element))
        }

        const selectedEnterprise = displays.cards['enterprise'].selectedItem()
        const selectedActivity = displays.cards['activity'].selectedItem()
        
        if(selectedActivity !== null){
            const applicableObjectives = getApplicableObjectivies(selectedEnterprise, selectedActivity)
            applicableObjectives.forEach(objective => {
                requiredStates.loaded.push(objective)
            })

            if(applicableObjectives.length > 0){
                requiredStates.loaded.push('mechanism')
            }
        } 
    }

    function getRequiredObjectiveCardStates(requiredStates){
        const loadedObjectives = Object.keys(displays.cards).filter(title => title !== 'enterprise' && title !== 'activity')
        loadedObjectives.forEach(objective => {
            if(!requiredStates.loaded.includes(objective)){
                requiredStates.unloaded.push(objective)
            }
        })
    }

    getRequiredStatesFromEnterpriseCard(requiredLoadStates)

    if(cardLoaded('activity')){
        getRequiredStatesFromActivityCard(requiredLoadStates)
        getRequiredObjectiveCardStates(requiredLoadStates)
    }

    getLoadActions(requiredLoadStates, requiredActions)

    
    await executeUnloadActions (requiredActions.unload)
    await executeLoadUpdateActions(requiredActions, requiredLoadStates.loaded)


}

class card {
    constructor(type, title){
        this.type = type
        this.title = title
    }

    

}

class cardItem {

    static fontSize = 16

    constructor(label, parentCardID, selectable = true){
        this.label = label
        this.parentCardID = parentCardID
        this.selectable = selectable
        this.setID()
    }

    setID(){
        switch(this.constructor.name){
            case 'cardLabel':
                this.id = this.parentCardID + 'label'
                break;
            case 'cardTag':
                this.id = this.parentCardID + this.label.replaceAll(' ','')
                break;
            default:
                this.id = this.label.replaceAll(' ','')
        } 
    }

}

class cardLabel extends cardItem {
    constructor(label, parentCardID){
        super(label, parentCardID, false)
    }
}

class selectionManager {

    updateItemSelection(itemID, itemsOnCard){
        const selectable = (item)=> item.selectable
        const idMatch = (item)=> item.id === itemID
        itemsOnCard.forEach(item => {
            item.selected = selectable(item) && idMatch(item) && !item.selected ? true : false
        })
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
        this.cards[card.title] = card
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

    static async createCard (title, prevCardTitle = null){
        const displayType = (title) => {
            return title === 'enterprise' || title === 'activity' || title === 'mechanism' ? 'listBoxCard' : 'optionCard'
        }
        const card = this.#factory.createCard(displayType(title), title)
        this.setAdjacentCards(card, prevCardTitle)
        displays.addCard(card)
        return this.#cardControl.setup(card)
    }

    static async loadCard(card){ 
        await this.#cardControl.load(card)
        return Promise.resolve()
    }

    static setAdjacentCards(thisCard, prevCardTitle){
        const prevCard = displays.cards[prevCardTitle]
        if(thisCard.title === 'enterprise'){
            thisCard.cardToLeft = null
            thisCard.cardAbove = null
        } else if (thisCard.title === 'activity'){
            thisCard.cardToLeft = 'enterprise'
            thisCard.cardAbove = null
        } else if (thisCard.title === 'mechanism') {
            thisCard.cardToLeft = 'enterprise'
            thisCard.cardAbove = 'activity'
        } else {
            thisCard.cardToLeft = null
            thisCard.cardAbove = prevCard.constructor.name === 'optionCard' ? prevCard.title : 'enterprise'
        }
    }

    static async updateCard(title, prevCardTitle){
        const card = displays.cards[title]
        this.setAdjacentCards(card, prevCardTitle)

        if(card.constructor.name === 'optionCard'){
            await this.#cardControl.update(card)
        }
        return Promise.resolve()
    }

    static async unloadCard(title){
        const card = displays.cards[title]
        await this.#cardControl.unload(card)
        card.div.remove()
        delete displays.cards[title]
        return Promise.resolve()
    }


    static mouseoverItem(item){
        if(item.constructor.name === 'cardTag'){
            this.#cardControl.mouseOverTagItem(item)
        } else if (item.constructor.name === 'cardItem'){
            this.#cardControl.mouseoverItem(item)
        }
    }

    static mouseOffItem(item){
        if(item.constructor.name === 'cardTag'){
            this.#cardControl.mouseOffTagItem(item)
        } else if (item.constructor.name === 'cardItem'){
            this.#cardControl.mouseOffItem(item)
        }
    }

    static itemClicked(item){
        const clickedCard = displays.cards[item.cardID]
        this.#selectionManager.updateItemSelection(item.id, clickedCard.items)
        clickedCard.items.forEach(item => {
            if(!item.selected){this.#cardControl.updateFontWeight(item.id)}
        })
        updateCards()
    }
}

class cardControl {

    constructor(){
        this.handler = new dataHandler ()
        this.dynamics = new cardDynamics ()
        this.contentDynamics = new cardContentDynamics ()
    }

    setup(card){
        this.#setItems(card)
        this.#setSize(card)
        return this.#setPosition(card)
    }

    #setItems(card){
        card.items = this.handler.getCardData(card.title)
    }

    #setSize(card){
        const dimensions = cardSizing.calculateStartingDimensions(card)
        this.dynamics.resize(card, dimensions, 0)
    }

    #setPosition(card){
        const coordinates = cardPositioning.calculatePreEntryPosition(card)
        return this.dynamics.move(card, coordinates, 0)

    }

    async load(card){
        this.contentDynamics.renderItems(card, 150)

        if(card.constructor.name === 'listBoxCard'){
            this.dynamics.emerge(card, 300)
        } else if (card.constructor.name === 'optionCard'){
            this.dynamics.emerge(card)
            const position = cardPositioning.calculateStartingPosition(card)
            await this.dynamics.move(card, position, 150)
        }

        return Promise.resolve()

    }

    update(card){
        const position = cardPositioning.calculateStartingPosition(card)
        return this.dynamics.move(card, position, 200)
    }

    async unload(card){
        const position = cardPositioning.calculateRemovalPosition(card)
        card.items = []
        this.contentDynamics.renderItems(card, 300)
        if(card.constructor.name === 'listBoxCard'){
            await this.dynamics.sink(card, 300)
        } else if (card.constructor.name === 'optionCard'){
            await this.dynamics.move(card, position, 100)
        }
        
        return Promise.resolve()
    }

    mouseOverTagItem(tagItem){
        this.updateRectFill(tagItem.id, 'gold')
    }

    mouseOffTagItem(tagItem){
        this.updateRectFill(tagItem.id, 'grey')
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

    updateRectFill(itemID, fill){
        const elem = d3.select('#' + itemID)
        elem.select('rect').attr('fill', fill)
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
    static calculatePreEntryPosition(card){
        const pos = {}
        if(card.constructor.name === 'listBoxCard'){
            pos.left = this.calculateLeft(card)
        } else if (card.constructor.name  === 'optionCard'){
            pos.left = -350
        }
        
        pos.top = this.calculateTop(card)
        return pos

    }

    static calculateStartingPosition(card){
        const pos = {}
        pos.left = this.calculateLeft(card)
        pos.top = this.calculateTop(card)
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

    static calculateLeft(card){
        const cardToLeft = this.getAdjacentCard(card.cardToLeft)
        const startLeft = this.getCardLeftValue(cardToLeft)
        const width = cardSizing.getWidth(cardToLeft)
        return startLeft + width + cardSizing.padding 
    }

    static calculateTop(card){
        const cardAbove = this.getAdjacentCard(card.cardAbove)
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



    static getAdjacentCard(cardTitle){ 
        return cardTitle === null ? null : displays.cards[cardTitle]
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

class cardDynamics {

    emerge(card, duration = 0){
        return card.div.transition()
            .duration(duration)
            .ease(d3.easeCubicIn)
                .style('background-color', 'white')
                .style('box-shadow', '5px 5px 10px rgba(0, 0, 0, 0.3)')
            .end()
    }

    sink(card, duration = 0){
        return card.div.transition()
            .duration(duration)
            .ease(d3.easeCubicIn)
                .style('background-color', '#F6F7F9')
                .style('box-shadow', '0px 0px 0px rgba(0, 0, 0, 0)')
            .end()
    }

    move(card, coordinates, duration = 0){
        return card.div.transition()
            .duration(duration)
                .style('top', coordinates.top + 'px')
                .style('left', coordinates.left + 'px')
            .end()
    }

    async resize(card, dimensions, duration){
        this.#resizeSvg(card.svg, dimensions)
        return this.#resizeDiv(card.div, dimensions, duration)
    }

    #resizeDiv(div, dimensions, duration){
        return div.transition()
            .duration(duration)
                .style('width', dimensions.width + 'px')
                .style('height', dimensions.height + 'px')
            .end()
    }

    #resizeSvg(svg, dimensions, duration = 0){
        return svg.transition()
            .duration(duration)
                .attr('width', dimensions.width)
                .attr('height', dimensions.height)
    }

    setWidth(card){
        const width = cardSizing.calculateCardWidth(card.id)
        card.div.style('width', width + 'px')
        card.svg.style('width', width)
    }

    setHeight(card){
        const height = cardSizing.calculateCardHeight(card.items.length)
        card.div.style('height', height + 'px')
        card.svg.style('height', height)
    }

    expand(card, duration = 0){
        const calculateHeight = (itemCount) => {
            const itemHeight = Math.round(cardItem.fontSize)
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

    

    contract(card, duration = 0){
        const calculateHeight = (itemCount) => {
            return (itemCount + 1) * cardItem.fontSize
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
    async renderItems(card, duration = 0){
        const fn = {
            positioning: new cardItemPositioning (card),
            styling: new cardItemStyling (card.items),
        }

        const transitions = []

        card.svg.selectAll('g')
            .data(card.items, d => d.id)
            .join(
                enter => {
                    const t = this.enterItems(enter, fn)
                    t.duration(duration)
                    transitions.push(t)
                    return t
                },
                update => {
                    const t = this.updateItems(update, fn)
                    t.duration(duration)
                    transitions.push(t)
                    return t
                },
                exit => {
                    const t = this.exitItems(exit, fn)
                    t.duration(duration)
                    transitions.push(t)
                    return t
                }
            )
        
        return Promise.all(transitions.map(t => t.end()))

    }

    enterItems(selection, fn){

        const groups = selection.append('g')
            .attr('id', d => d.id)
            .attr('class', fn.cardLabel)
            .attr('transform', (d, i) => {return fn.positioning.getTranslate(d, i)})
            .on('mouseover', (event, d) => orchestration.handleCardItemHovering(event, d))
            .on('mouseout', (event, d) => orchestration.handleCardItemHovering(event, d))
            .on('click', (event, d) => orchestration.handleCardItemClick(event, d))

        const notTags = groups.filter(elem => elem.constructor.name !== 'cardTag')
        const text = notTags.append('text')
            .text(d => d.label)
            .style('fill', 'white')
            .attr('font-size', '0.8em')
            .attr('dx', 0)
            .attr('dy', '0.8em')

        const tags = groups.filter(elem => elem.constructor.name === 'cardTag')
        tags.append('rect')
            .attr('width', 15)
            .attr('height', 15)
            .attr('fill', 'grey')
            
        return text.transition()
            .ease(d3.easeCircleIn) 
            .style('fill', d => fn.styling.getTextColour(d))

    }

    updateItems(selection, fn){
        const groups = selection.transition()
            .attr('transform', (d, i) => {return fn.positioning.getTranslate(d, i)})

        const text = groups.select('text')
        
        text.style('font-weight', d => fn.styling.getFontWeight(d))
            .style('fill', d => fn.styling.getTextColour(d))
            
        return groups
    }

    exitItems(selection, fn){
        const text = selection.select('text')
            .transition('textFadeOut')
                .style('fill', '#F6F7F9')
            .on('end', () => {d3.select(this).remove()})
        
        return text
    }

}


class cardItemStyling {
    constructor(items){
        this.items = items
    }

    getTextColour(d, i){
        switch(d.constructor.name){
            case 'title':
                return '#336BF0'
            case 'subTitle':
                return 'grey'
            case 'item':
                return this.getItemTextColour(d)
            case 'cardTag':
                return 'white'
        }

    }

    getItemTextColour(d){
        if(!d.selectable){
            return '#AEB3BD'
        }

        if(d.cardID === 'mechanism' && d.selected){
            return 'gold'
        }

        return '#131C3E'

    }

    getRectColour(d){
        return d.selected ? 'gold' : 'grey'
    }

    

    getFontWeight(d){
        return d.selected && d.cardID !== 'mechanism' ? 'bold' : 'normal'
    }

    getTextAnchor(d, fn){
        return fn.cardLabel === 'obligation' ? 'end' : 'start'
    }

    getSelectedItemIndex(){
        return this.items.findIndex(item => item.selected === true)
    }

}

class cardItemPositioning {

    constructor(card){
        this.items = card.items
        this.cardWidth = card.width
    }

    getTranslate(d, i){
        const x = this.getPosX(d, i)
        const y = this.getPosY(d, i)
        return d3Helper.getTranslateString(x, y)
    }

    getPosX(d, i){
        const selectedIndex = this.getSelectedItemIndex()

        switch(d.constructor.name){
            case 'title':
            case 'subTitle':
                return cardSizing.padding
            case 'item':
                return this.getItemPosX(d)
            case 'cardTag':
                 return this.cardWidth - ((i - 2) * 20) - cardSizing.padding * 2
        }
    }

    getItemPosX(d){
        const selectedIndex = this.getSelectedItemIndex()
        
        if(selectedIndex > -1 && this.isExclusiveSelectionCard(d)){
            return !d.selected ? - 300 : cardSizing.padding 
        } else {
            return cardSizing.padding
        }
    }

    isExclusiveSelectionCard(d){
        console.log(d)
        return d.cardID !== 'mechanism' && d.concept !== 'obligation'
    }
    
    getPosY(d, i){
        const listPos = this.getListPosition(d, i)
        return listPos * cardItem.fontSize + cardItem.fontSize
    }

    getListPosition(d, i){
        switch(d.constructor.name){
            case 'title':
            case 'cardTag':
                return 0
            case 'subTitle':
                return 1
            case 'item':
                return this.getItemListPosition(d, i)
            
        }
    }

    getItemListPosition(d, i){
        if(d.cardID === 'mechanism' || !d.selected){
            return i
        }

        if(d.selected){
            return 1
        }

    }

    getSelectedItemIndex(){
        return this.items.findIndex(item => item.selected === true)
    }

}

class dataHandler{

    static getEnterprises(){
        return [
            'side hustle',
            'construction company',
            'freelance profressional'
        ]
    }

    static getActivities(){
        return [
            'paying employees',
            'selling to enterprise',
            'selling to a customer',
            'starting the business',
            'setting up fin mgmt systems'
        ]
    }

    static getMechanisms(){
        return [
            'entreprenuers bank account',
            'government business registry',
            'business accounting software',
            'manual calculation',
            'government lodgment portal',
            'manual electronic funds transfer',
            'payroll software',
            'point of sale system'
        ]
    }
    
    static getOptionCardData(title){
        const obligations = obligationData.getAllObligations()
        const thisObligation = obligations.find(item => item.description === title)
        const mechanisms = mechanismData.getApplicableMechanisms(thisObligation.description)
        
        const items = []
        items.push(thisObligation)

        mechanisms.forEach(description => {
            items.push(new mechanism(description))
        })

        return items
    }


    getCardData(title){
        switch(title){
            case 'enterprise':
                return enterpriseData.getItems()
            case 'activity':
                return activityData.getItems()
            case 'mechanism':
                return mechanismData.getItems()
            default:
                return this.getOptionCardData(title)
        }
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
            case 'calculate payroll tax':
                mechanisms.push('manual calculation')
            case 'collect payroll tax':
            case 'report payroll tax':
            case 'pay payroll tax':
                mechanisms.push('payroll software')
                break;
            
            case 'calculate vat':
                mechanisms.push('manual calculation')
            case 'report vat':
                mechanisms.push('business accounting software')
            case 'pay vat':
            case 'collect vat':
                mechanisms.push('point of sale system')
                break;
            
            case 'register for income tax':
                mechanisms.push('government business registry')
            case 'record keep for income tax':
            case 'calculate income tax':
            case 'report income tax': 
                mechanisms.push('business accounting software')
            case 'pay income tax':
                mechanisms.push('entreprenuers bank account')
                break;
        }
        return mechanisms
    }

    static getAll(){
            new cardItem ('entreprenuers bank account'),
            new cardItem ('government business registry'),
            new cardItem ('business accounting software'),
            new cardItem ('manual calculation'),
            new cardItem ('government lodgment portal'),
            new cardItem ('manual electronic funds transfer'),
            new cardItem ('payroll software'),
            new cardItem ('point of sale system')
    }

    static getItems (){
        return [
            new cardLabel ('mechanism'),
            new cardItem ('entreprenuers bank account'),
            new cardItem ('government business registry'),
            new cardItem ('business accounting software'),
            new cardItem ('manual calculation'),
            new cardItem ('government lodgment portal'),
            new cardItem ('manual electronic funds transfer'),
            new cardItem ('payroll software'),
            new cardItem ('point of sale system')
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
