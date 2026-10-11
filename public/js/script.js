(() => {
  'use strict'

  // Bootstrap-style client-side form validation.
  document.querySelectorAll('.needs-validation').forEach((form) => {
    form.addEventListener('submit', (event) => {
      const ratingInput = form.querySelector('input[name="review[rating]"][required]')
      const ratingFeedback = form.querySelector('[data-rating-feedback]')
      const hasSelectedRating = Boolean(form.querySelector('input[name="review[rating]"]:checked:not(.input-no-rate)'))

      if (ratingInput && ratingFeedback) {
        ratingFeedback.hidden = hasSelectedRating
        ratingFeedback.classList.toggle('d-block', !hasSelectedRating)
      }

      const formIsValid = form.checkValidity() && (!ratingInput || hasSelectedRating)

      if (!formIsValid) {
        event.preventDefault()
        event.stopPropagation()
      }

      form.classList.add('was-validated')
    })
  })

  document.querySelectorAll('input[name="review[rating]"]').forEach((input) => {
    input.addEventListener('change', () => {
      const feedback = input.form?.querySelector('[data-rating-feedback]')
      if (!feedback) return
      feedback.hidden = true
      feedback.classList.remove('d-block')
    })
  })

  // Category chips filter the stays currently loaded on the page.
  const filterButtons = [...document.querySelectorAll('.filter[data-category-filter]')]
  const listingCards = [...document.querySelectorAll('[data-listing-item]')]
  const filterStatus = document.getElementById('filter-status')
  const categoryEmptyState = document.getElementById('category-empty-state')
  const resultsSummary = document.getElementById('results-summary')
  const categoryTerms = {
    rooms: ['room', 'loft', 'apartment', 'cottage', 'cabin', 'chalet', 'villa', 'bungalow', 'penthouse', 'treehouse', 'house', 'lodge', 'hotel', 'retreat'],
    cities: ['city', 'downtown', 'historic', 'canal', 'brownstone', 'apartment', 'tuscany', 'tokyo', 'miami', 'boston', 'amsterdam', 'florence', 'scotland'],
    mountains: ['mountain', 'alpine', 'ski', 'aspen', 'banff', 'rockies', 'hill'],
    castles: ['castle', 'fortress', 'fort', 'palace', 'manor'],
    pools: ['pool', 'swimming'],
    camping: ['camp', 'tent', 'campsite'],
    farms: ['farm', 'ranch', 'barn', 'vineyard', 'orchard'],
    arctic: ['arctic', 'snow', 'winter', 'polar', 'ice', 'ski'],
    domes: ['dome', 'geodesic'],
    boats: ['boat', 'yacht', 'ship', 'sailing', 'houseboat']
  }

  const updateCategoryFilter = (category) => {
    let visibleCount = 0

    listingCards.forEach((card) => {
      const searchableText = (card.dataset.searchable || '').toLowerCase()
      const cardIndex = Number(card.dataset.listingIndex)
      const terms = categoryTerms[category] || []
      const isVisible = !category || (category === 'trending'
        ? cardIndex < 6
        : terms.some((term) => searchableText.includes(term)))

      card.hidden = !isVisible
      card.classList.toggle('d-none', !isVisible)
      if (isVisible) visibleCount += 1
    })

    filterButtons.forEach((button) => {
      const isActive = button.dataset.categoryFilter === category
      button.classList.toggle('active', isActive)
      button.setAttribute('aria-pressed', String(isActive))
    })

    if (filterStatus) {
      const activeButton = filterButtons.find((button) => button.dataset.categoryFilter === category)
      const categoryName = activeButton?.querySelector('.filter-label')?.textContent.trim()
      filterStatus.textContent = categoryName
        ? `${visibleCount} ${visibleCount === 1 ? 'stay' : 'stays'} shown in ${categoryName}.`
        : `${visibleCount} ${visibleCount === 1 ? 'stay' : 'stays'} shown.`
    }

    if (resultsSummary) {
      const activeButton = filterButtons.find((button) => button.dataset.categoryFilter === category)
      const categoryName = activeButton?.querySelector('.filter-label')?.textContent.trim()
      const searchQuery = resultsSummary.dataset.searchQuery
      const resultWord = visibleCount === 1 ? 'result' : 'results'
      resultsSummary.textContent = searchQuery
        ? `${visibleCount} ${resultWord} for “${searchQuery}”${categoryName ? ` in ${categoryName}` : ''}`
        : `${visibleCount} stay${visibleCount === 1 ? '' : 's'}${categoryName ? ` in ${categoryName}` : ''}`
    }

    categoryEmptyState?.classList.toggle('d-none', visibleCount > 0)
  }

  filterButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const currentCategory = button.dataset.categoryFilter
      const isAlreadyActive = button.getAttribute('aria-pressed') === 'true'
      updateCategoryFilter(isAlreadyActive ? '' : currentCategory)
    })
  })

  document.getElementById('clear-category-filter')?.addEventListener('click', () => {
    updateCategoryFilter('')
  })

  // Update listing prices to include the displayed 18% tax estimate.
  const taxSwitch = document.getElementById('flexSwitchCheckDefault')
  taxSwitch?.addEventListener('change', () => {
    document.querySelectorAll('.listing-price').forEach((priceElement) => {
      const basePrice = Number(priceElement.dataset.basePrice)
      const totalElement = priceElement.parentElement.querySelector('.listing-price-total')

      if (!totalElement) return

      if (taxSwitch.checked) {
        const totalPrice = Math.round(basePrice * 1.18)
        priceElement.classList.add('d-none')
        totalElement.textContent = `₹${totalPrice.toLocaleString('en-IN')} / night (incl. 18% GST)`
        totalElement.classList.remove('d-none')
      } else {
        priceElement.classList.remove('d-none')
        totalElement.classList.add('d-none')
        totalElement.textContent = ''
      }
    })
  })
})()
