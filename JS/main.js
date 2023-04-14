class Carousel {

    /**
     * callbacks type
     * @moveCallbacks moveCallbacks
     * @param {number} index
     */
    
    /**
     * 
     * @param {HTMLElement} element 
     * @param {Object} options 
     * @param {Object} [options.slidesToScroll=1] Nombres d'éléments à faire défiler 
     * @param {Object} [options.slidesVisible=1] Nombres d'éléments visible dans le slide 
     * @param {boolean} [options.loop=false] Boucle de fin de carousel retour au début et inversément  
     * @param {boolean} [options.pagination=false]  Bouton d'information de la page en cour
     * @param {boolean} [options.navigation=true]  Navigation par défaut active
     * @param {boolean} [options.infinite=false]  Déroulement infini
    */
   constructor (element, options = {}) {
        this.element = element
        this.options = Object.assign({}, {
            slidesToScroll: 1,
            slidesVisible: 1,
            loop: false,
            pagination: false,
            navigation: true,
            infinite: false
        }, options)
        let children = [].slice.call(element.children)
        this.isMobile = true
        this.currentItem = 0
        this.moveCallbacks = []
        this.offset = 0

        // Modiffication du DOM
        this.root = this.createDivWithClass('carousel')
        this.container = this.createDivWithClass('carousel__container')
        this.root.setAttribute('tabindex', '0')
        this.root.appendChild(this.container)
        this.element.appendChild(this.root)
        this.items = children.map((child) => {
            let item = this.createDivWithClass('carousel__item')
            item.appendChild(child)
            return item           
        })
        if (this.options.infinite) {
            this.offset = this.options.slidesVisible + this.options.slidesToScroll
            if (this.offset > children.length) {
                console.log("Vous n'avez pas assez d'élément dans le carousel", element)
            }
            this.items = [
                ...this.items.slice(this.items.length - this.offset).map(item => item.cloneNode(true)),
                ...this.items,
                ...this.items.slice(0, this.offset).map(item => item.cloneNode(true)),
            ]
            this.gotoItem(this.offset, false)
        }
        this.items.forEach(item => this.container.appendChild(item))
        this.setStyle()
        if(this.options.navigation) {
            this.createNavigation()
        }
        if(this.options.pagination) {
            this.createPagination()
        }

        // Evenements
        this.moveCallbacks.forEach(cb => cb(this.currentItem))
        this.onWindowResize()
        window.addEventListener('resize', this.onWindowResize.bind(this))
        this.root.addEventListener('keyup', e => {
            if (e.key === 'ArrowRight' || e.key ==='Right') {
                this.next()
            } else if (e.key === 'ArrowLeft' || e.key ==='Left') {
                this.prev()
            }
        })
        if (this.options.infinite) {
            this.container.addEventListener('transitionend', this.resetInfinite.bind(this))
        }
    }

    /**
     * Applique les bonnes dimensions aux élémentsdu carousel 
     */
    setStyle () {
        let ratio = this.items.length / this.slidesVisible
        this.container.style.width = (ratio * 100) + "%"
        this.items.forEach(item => item.style.width = ((100 / this.slidesVisible) / ratio) + "%")
    }
    
    /**
     * Les bouttons de navigation
     */
    createNavigation () {
        let nextButton = this.createDivWithClass('carousel__next')
        let prevButton = this.createDivWithClass('carousel__prev')
        this.root.appendChild(nextButton)
        this.root.appendChild(prevButton)
        nextButton.addEventListener('click', this.next.bind(this))
        prevButton.addEventListener('click', this.prev.bind(this))
        if (this.options.loop === true){
            return
        }
        this.onMove(index => {
            if (index === 0){
                prevButton.classList.add('carousel__prev--hidden')
            } else {
                prevButton.classList.remove('carousel__prev--hidden')
            }
            if (this.items[this.currentItem + this.slidesVisible] === undefined) {
                nextButton.classList.add('carousel__next--hidden')
            } else {
                nextButton.classList.remove('carousel__next--hidden')
            }
        })
    }

    /**
     * 
     *crée la pagination dans le DOM
     */
    createPagination () {
        let pagination = this.createDivWithClass('carousel__pagination')
        let buttons = []
        this.root.appendChild(pagination)
        for (let i = 0; i < (this.items.length - 2 * this.offset); i = i + this.options.slidesToScroll) {
            let button = this.createDivWithClass('carousel__pagination__button')
            button.addEventListener('click', () => this.gotoItem(i + this.offset))
            pagination.appendChild(button)
            buttons.push(button)
        }
        this.onMove(index => {
            let count = this.items.length - 2 * this.offset
            let activeButton = buttons[Math.floor(((index - this.offset) % count) / this.options.slidesToScroll)]
            if (activeButton) {
                buttons.forEach(button => button.classList.remove('carousel__pagination__button--active'))
                activeButton.classList.add('carousel__pagination__button--active')
            }
        })
    }

    /**Fonction next pour passer à l'image suivante  */
    next () {
        this.gotoItem(this.currentItem + this.slidesToScroll)
    }
    
    /**Fonction previous pour revenir à l'image précédente*/
    prev () {
        this.gotoItem(this.currentItem - this.slidesToScroll)
    }
    /**
     * Déplace le carousel vers l'élément ciblé
     * @param {number} index 
     * @param {boolean} [animation = true] 
     */
    gotoItem (index, animation = true) {
        if(index < 0) {
            if (this.options.loop) {
                index = this.items.length - this.slidesVisible
            } else {
                return
            }
        } else if (index >= this.items.length || this.items[this.currentItem + this.slidesVisible] === undefined && index > this.currentItem) {
            if (this.options.loop){
                index = 0
            } else {
                return
            }
        }
        let translateX = index * -100 / this.items.length
        if (animation === false) {
            this.container.style.transition = 'none'
        }
        this.container.style.transform = 'translate3d(' + translateX + '%, 0, 0)'
        this.container.offsetHeight // force repaint
        if (animation === false) {
            this.container.style.transition = ''
        }
        this.currentItem = index
        this.moveCallbacks.forEach(cb => cb(index))
    }
    /**
     * Déplace le container pour faire l'effect infini
     */
    resetInfinite () {
        if (this.currentItem <= this.options.slidesToScroll) {
            this.gotoItem(this.currentItem + (this.items.length - 2 * this.offset), false)
        }else if (this.currentItem >= this.items.length - this.offset) {
            this.gotoItem(this.currentItem - (this.items.length - 2 * this.offset), false)

        }
    }

    /**
     * 
     * @param {moveCallbacks} cb 
     */
    onMove(cb) {
        this.moveCallbacks.push(cb)

    }

    onWindowResize () {
        let mobile = window.innerWidth < 800
        if (mobile !== this.isMobile) {
            this.isMobile = mobile
            this.setStyle()
            this.moveCallbacks.forEach(cb => cb(this.currentItem))
        }
    }

    /**
     * 
     * @param {string} className
     * @returns {HTMLElement}
     */
    createDivWithClass (className) {
        let div = document.createElement('div')
        div.setAttribute('class', className)
        return div
    }

    /**
     * @returns {number}
     */
    get slidesToScroll () {
        return this.isMobile ? 1 : this.options.slidesToScroll
    }
    /**
     * @returns {number}
     */
    get slidesVisible () {
        return this.isMobile ? 1 : this.options.slidesVisible
    }
}
let onReady = function () {
    new Carousel(document.querySelector('#carousel1'), {
        slidesVisible: 3,
        slidesToScroll: 1,
        pagination: true,
        loop: false,
        infinite: true
    })
    new Carousel(document.querySelector('#carousel2'), {
        slidesVisible: 3,
        slidesToScroll: 1,
        pagination: true,
        loop: false,
        infinite: true
    })
    new Carousel(document.querySelector('#carousel3'), {
        slidesVisible: 3,
        slidesToScroll: 2,
        pagination: true,
        loop: false,
        infinite: true
    })
    new Carousel(document.querySelector('#carousel4'), {
        slidesVisible: 3,
        slidesToScroll: 2,
        pagination: true,
        loop: false,
        infinite: true
    })
}
// onReady()

if  (document.readyState !== 'loading') {
    onReady()
}



// document.addEventListener('DOMContentLoaded', function () {
//     new Carousel(document.querySelector('#carousel1'), {
//         slidesVisible: 3
//     })
//     console.log('test00')
// })






