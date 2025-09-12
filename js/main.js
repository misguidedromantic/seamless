window.onload = async function(){
    console.log('1124')
    displays.loadSME()
}

function onItemClick(){
    console.log('click')
    displays.expandSME()

        
/*     const clickedElement = d3.select(this)
    let i = undefined
    try{
        const id = clickedElement.attr('id')
        i = data.findIndex(obj => obj.type === id)
    } catch {
        i = 1
    } finally {
        for(let j = 0; j < data.length; j++){
            
            switch(j){
                case 0:
                case i:
                    data[j].selected = true
                    break;
                default:
                    data[j].selected = false
            }
        }
    } */
}

function onItemHover(){
    console.log('hover')
    displays.expandSME()
}


function onItemOff(){

}


class displays {
    
    static sme = {}

    static loadSME (){
        const SMEs = [
            'Side Hustle',
            'Construction Company',
            'Freelance Profressional'
        ]

        this.sme = new display ('SME', SMEs)
        this.sme.fitToContentState()
    }

    static expandSME(){
        this.sme.fitToContentState('expanded')
    }

    static contractSME(){
        this.sme.fitToContentState('contracted')
    }

}

class display {

    #windowControl = {}
    #contentControl = {}

    constructor(title, content){
        this.title = title
        this.content = content
        this.setup()
    }

    setup(){  
        this.#createWindow()
        this.#createContent()
    }

    load(){
        this.#contentControl.render(d3.select('#SMEsvg'))
        this.fitToContentState()
    }

    fitToContentState(contentState = 'contracted'){
        let width = window.innerWidth
        let height = 0

        switch(contentState){
            case 'contracted':
                height = menuItem.fontSize + 10
                break;
            case 'expanded':
                height = menuItem.fontSize * this.#contentControl.items.length + 10
                break;
        }

        this.#windowControl.resize({width: width, height: height})

    }

    getCanvas(){
        return this.#windowControl.svg
    }

    #createWindow(){
        this.#windowControl = new windowControl()
        this.#windowControl.createDiv(this.title)
        this.#windowControl.createSVG(this.title)
    }

    #createContent(){
        console.log(this.title)
        console.log(this.content)
        this.#contentControl = new menu (this.title, this.content)
    }


}


class menu {
    items = []
    maxHeight = 0
    maxWidth = 0

    constructor(title, options){
        this.title = title
        this.createItems(options)
    }

    createItems(options){
        this.items.push(new menuItem ('title', this.title))
        this.items.push(new menuItem ('selector', 'click to select'))

        options.forEach(option => {
            this.items.push(new menuItem ('selectable', option))
        });
    }

    getSelectedItemIndex(){
        return this.items.findIndex(item => item.selected === true)
    }

    render(svg){

        console.log('render')

        const positioning = new menuItemPositioning (this.items)
        const styling = new menuItemStyling (this.items)
        const onClick = onItemClick()

        svg.selectAll('g.sme')
            .data(this.items, d => d.label)
            .join(
                enter => {
                    const groups = enter.append('g')
                        .attr('class', 'sme')
                        .attr('id', d => d.label)
                        .attr('transform', (d, i) => {return positioning.getTranslate(d, i)})
                        .on('click', onClick)

                    groups.append('text')
                        .text(d => d.label)
                        .style('fill', d => styling.getTextColour(d))
                        .attr('dx', 15)
                        .attr('dy', 9)
                    
                    return groups
                }
            )
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
}

class menuItemPositioning {

    constructor(items){
        this.items = items
    }

    getTranslate(d, i){
        const x = this.getPosX()
        const y = this.getPosY(d, i)
        return d3Helper.getTranslateString(x, y)
    }

    getPosX(){
        return 10
    }
    
    getPosY(d, i){
        if(this.getSelectedItemIndex() === -1){
            return 150 + (i + 1) * menuItem.fontSize * 2
        } else {
            return 150 + d.selected ? menuItem.fontSize * 2 : -50
        }
    }

    getSelectedItemIndex(){
        return this.items.findIndex(item => item.selected === true)
    }

}

class menuItem {

    static fontSize = 11

    constructor(type, label){
        this.type = type
        this.label = label
        this.selected = false
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
        this.div = container.append('div').attr('id', id + 'Div')
    }
    
    createSVG(id, container = this.div){
        this.svg = container.append('svg').attr('id', id + 'Svg')
    }

    resize(dimensions){
        this.resizeDiv(dimensions.width, dimensions.height)
        this.resizeSVG(dimensions.width, dimensions.height)
    }

    resizeDiv(width, height){
        this.div.style('width', width + "px").style('height', height + "px")
    }

    resizeSVG(width, height){
        this.svg.attr('width', width).attr('height', height)
    }

}

class svg {

    width = 0
    height = 0

    constructor(id, container = d3.select('body')){
        this.id = 'svg' + id
        this.container = container
        this.createElement()
    }
    createElement(width = 10, height = 10){
        this.container.append('svg')
            .attr('id', this.id)
    }

    getElement(){
        return d3.select('#' + this.id)
    }

    resize(width, height){
        const elem = this.getElement()
        elem.attr('width', width)
            .attr('height', height)
    }
}

class div {

    width = 0
    height = 0
    top = 0
    left = 0
    
    constructor(id, container = d3.select('body')){
        this.id = 'div' + id
        this.container = container
        this.createElement(id)
    }

    createElement(){
        this.container.append('div').attr('id', this.id)
    }

    getElement(){
        return d3.select('#' + this.id)
    }

    resize(width, height, transition){
        const elem = this.getElement()
        elem.transition(transition)
            .style('width', width + 'px')
            .style('height', height + 'px')
    }

}

class d3Helper {
    static getTranslateString(x, y){
        return "translate(" + x + "," + y + ")"
    }
} 