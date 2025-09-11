window.onload = async function(){
    
    display.setup()
    displays.loadSME()
}

function onItemClick(){
        
    const clickedElement = d3.select(this)
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
    }
}


class displays {
    static sme = {}

    static loadSME (){
        const SMEs = [
            'Side Hustle',
            'Construction Company',
            'Freelance Profressional'
        ]

        this.sme = new menu ('SME', SMEs)
        this.sme.render()

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

    render(svg = d3.select('#displaySvg')){

        const positioning = new menuItemPositioning (this.items)
        const styling = new menuItemStyling (this.items)
        
        svg.selectAll('g.sme')
            .data(this.items, d => d.label)
            .join(
                enter => {
                    const groups = enter.append('g')
                        .attr('class', 'sme')
                        .attr('id', d => d.label)
                        .attr('transform', (d, i) => {return positioning.getTranslate(d, i)})
                        .on('click', onItemClick)

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

class scenario {



}

class sme {

    constructor(type){
        this.type = type
        this.selected = false
    }

    select(){
        this.selected = true
    }

    deselect(){
        this.selected = false
    }

    toggleSelection(){
        this.selected = this.selected === false ? true : false
    }


}

class display {

    static #windowControl = {}

    static setup(){
        this.#windowControl = new windowControl()
        this.#createWindow()
        this.#setDimensions()
    }

    static getCanvas(){
        return this.#windowControl.svg
    }

    static #createWindow(){
        this.#windowControl.createDiv('display')
        this.#windowControl.createSVG('display')
    }

    static #setDimensions(){
        this.#windowControl.resize({width: window.innerWidth, height: window.innerHeight})
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

class svg{

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