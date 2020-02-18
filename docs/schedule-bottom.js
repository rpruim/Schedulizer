// javascrtipt to run after HTML has been processed.

console.log('loading js')

// declarations and initialization
let schedule = []
let morphTime = 1000
let width = window.innerWidth * 0.9
let height = window.innerHeight * 0.6
let margin = { top: 5, bottom: 40, left: 40, right: 40 }
let termHeight = height * 0.3
let locationScale, instructorScale
let colorScale = d3.scaleOrdinal().range(d3.schemeSet1)
let timeAxis, timeGrid, timeScale
let terms = ['F', 'W', 'S']

// setup
d3.selectAll('svg')
  .attr('width', width + margin.left + margin.right)
  .attr('height', height + margin.top + margin.bottom)

d3.selectAll('svg')
  .append('g')
  .attr('class', 'main-plot')

resize()
updateScales(schedule)

d3.select('#color-by').on('change', function() {
  updateColor()
})

// add functionality to clicking "Add Section"

d3.select('button.section.add').on('click', () => {
  let newSessions = sessionsFromControls()
  schedule = removeSessions(
    schedule,
    newSessions.map(d => d.sectionID)
  )
  schedule = addSessions(schedule, newSessions)
  d3.selectAll('rect.session').remove()
  renderSchedule(schedule) // , 'svg#schedule-by-location')
})

// add functionality to clicking "Delete Section"

d3.select('button.section.delete').on('click', () => {
  console.log('deleting a section')
  let controlSessions = sessionsFromControls()
  schedule = removeSessions(
    schedule,
    controlSessions.map(d => d.sectionID)
  )
  d3.selectAll('rect.session').remove()
  renderShedule(schedule) // , 'svg#schedule-by-location')
})

function sessionsFromControls() {
  let days = checkBoxes('input.days-checkbox')
  let newSessions = days.map(d => ({
    prefix: d3.select('input.section.prefix').property('value'),
    number: d3.select('input.section.number').property('value'),
    load: d3.select('input.section.load').property('value'),
    section: d3.select('input.section.letter').property('value'),
    instructor: d3.select('input.section.instructor').property('value'),
    startTimeStr: d3.select('input.section.start.time').property('value'),
    startTime: time_to_date(
      d3.select('input.section.start.time').property('value')
    ),
    duration: +d3.select('input.section.duration').property('value'),
    endTime: addMinutes(
      time_to_date(d3.select('input.section.start.time').property('value')),
      d3.select('input.section.duration').property('value')
    ),
    location: d3.select('input.section.location').property('value'),
    term: d3.select('input[name="term"]:checked').property('value'),
    days: days,
    day: d,
    sectionID: '',
    sessionID: '',
    random: Math.random(),
  }))
  newSessions.forEach(d => (d.sectionID = makeKey(d)))
  newSessions.forEach(d => (d.sessionID = d.sectionID + '-' + d.day))
  newSessions.forEach(d => (d.level = d.number[0] + '00'))
  newSessions.forEach(
    d => (d.load = d.load ? d.load : (d.days.length * d.duration) / 50)
  )
  return newSessions
}

/**
 *
 * @param {String} selection d3 slection string
 *
 * side:effect: set height/width of selected elements relative to browser size
 */
function resize(selection = 'svg') {
  width = Math.round(window.innerWidth * 0.4)
  height = Math.round(window.innerHeight * 0.5)
  termHeight = height * 0.3

  d3.selectAll(selection)
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)

  d3.selectAll(selection + ' g.main-plot').attr(
    'transform',
    `translate(${0 + margin.left} , ${0 + margin.top})`
  )
}

function updateScales(schedule) {
  console.log(schedule)
  locationScale = d3
    .scaleBand()
    .domain(schedule.map(d => d.location).sort())
    .range([0, width])
    .padding(0.1)

  dayInLocatoinScale = d3
    .scaleBand()
    .domain(['M', 'T', 'W', 'R', 'F'])
    .range([0, locationScale.bandwidth()])
    .padding(0.06)

  instructorScale = d3
    .scaleBand()
    .domain(schedule.map(d => d.instructor).sort())
    .range([0, width])
    .padding(0.1)

  dayInInstructorScale = d3
    .scaleBand()
    .domain(['M', 'T', 'W', 'R', 'F'])
    .range([0, instructorScale.bandwidth()])
    .padding(0.06)

  termScale = d3
    .scaleBand()
    .domain(terms)
    .range([0, height])
    .padding(0.1)

  timeScale = d3
    .scaleTime()
    .domain([time_to_date('07:00'), time_to_date('21:00')])
    .range([termScale(terms[0]), termScale(terms[0]) + termScale.bandwidth()])

  timeAxis = d3.axisLeft(timeScale)
  timeGrid = d3
    .axisLeft(timeScale)
    .tickFormat('')
    .tickSize(-width)

  updateColor()
}

function updateColor(color_by = '') {
  color_by = color_by ? color_by : d3.select('#color-by').property('value')
  colorScale.domain(schedule.map(d => d[color_by]))
  d3.selectAll('rect.session')
    .transition()
    .duration(morphTime)
    .style('fill', d => colorScale(d[color_by]))
}

// add array of sessions
/**
 *
 * @param {array of Objects} desc array of session descriptions
 */
function removeSessions(sechedule, ids) {
  let toBeRemoved = schedule.filter(d => ids.includes(d.sectionID))
  let n_removed = toBeRemoved.length
  schedule = schedule.filter(d => !ids.includes(d.sectionID))
  if (toBeRemoved.length > 0) {
    console.log(`removing ${toBeRemoved.map(d => d.sessionID).join(', ')}`)
  }
  console.log(`total sessions: ${schedule.length} [${n_removed} removed]`)

  return schedule
}

function addSessions(sechedule, sessions) {
  if (
    !sessions.every(d => d.prefix.length && d.number.length && d.term.length)
  ) {
    console.log('term, prefix, number are required')
    return schedule
  }
  let n_added = sessions.length
  schedule.push(...sessions)
  console.log(`adding ${sessions.map(d => d.sessionID).join(', ')}`)
  console.log(sessions)
  console.log(`total sessions: ${schedule.length} [${n_added} added]`)
  return schedule
}

function renderSchedule(sched) {
  selection = 'svg#schedule-by-location g.main-plot'
  updateScales(sched)

  for (term of terms) {
    d3.selectAll('svg .main-plot')
      .append('g')
      .attr('transform', 'translate(' + 0 + ', ' + termScale(term) + ')')
      .attr('class', 'axis')
      .call(timeAxis)

    d3.selectAll('svg .main-plot')
      .append('g')
      .attr('transform', 'translate(' + 0 + ', ' + termScale(term) + ')')
      .attr('class', 'axis')
      .call(timeGrid)
  }

  d3.select(selection)
    .selectAll('rect.session')
    .data(sched) // , d => d.sessionID)
    .join(
      enter => {
        enter
          .append('rect')
          .attr('class', 'session')
          .attr('x', d => locationScale(d.location) + dayInLocatoinScale(d.day))
          .attr('y', d => timeScale(d.startTime) + termScale(d.term))
          .attr('width', d => dayInLocatoinScale.bandwidth())
          .attr('height', d => timeScale(d.endTime) - timeScale(d.startTime))
      },
      update => {
        update
          .transition()
          .duration(morphTime)
          .attr('x', d => locationScale(d.location) + dayInLocatoinScale(d.day))
          .attr('y', d => timeScale(d.startTime) + termScale(d.term))
          .attr('width', d => dayInLocatoinScale.bandwidth())
          .attr('height', d => timeScale(d.endTime) - timeScale(d.startTime))
      },
      exit => {
        exit.remove()
      }
    )
  selection = 'svg#chedule-by-instructor g.main-plot'
  updateScales(sched)
  d3.select(selection)
    .selectAll('rect.session')
    .data(sched) // , d => d.sessionID)
    .join(
      enter => {
        enter
          .append('rect')
          .attr('class', 'session')
          .attr(
            'x',
            d => instructorScale(d.instructor) + dayInInstructorScale(d.day)
          )
          .attr('y', d => timeScale(d.endTime) + termScale(d.term))
          .attr('width', d => dayInInstructorScale.bandwidth())
          .attr('height', d => timeScale(d.endTime) - timeScale(d.startTime))
      },
      update => {
        update
          .transition()
          .duration(morphTime)
          .attr(
            'x',
            d => instructorScale(d.location) + dayInInstructorScale(d.day)
          )
          .attr('y', d => timeScale(d.endTime) + termScale(d.term))
          .attr('width', d => dayInInstructorScale.bandwidth())
          .attr('height', d => timeScale(d.endTime) - timeScale(d.startTime))
      },
      exit => {
        exit.remove()
      }
    )

  d3.selectAll('rect.session').on('click', d => updateControls(d))
  updateColor()
}

/**
 *
 * @param {String} selector d3 selector string
 * @returns {array of String}} array of values from check boxes
 */
function checkBoxes(selector) {
  var choices = []
  d3.selectAll(selector).each(function(d) {
    cb = d3.select(this)
    if (cb.property('checked')) {
      choices.push(cb.property('value'))
    }
  })
  return choices
}

function updateControls(d) {
  d3.select(`input[name="term"][value="${d.term}"]`).property('checked', true)
  d3.select('input.section.prefix').property('value', d.prefix)
  d3.select('input.section.number').property('value', d.number)
  d3.select('input.section.load').property('value', d.load)
  d3.select('input.section.letter').property('value', d.section)
  d3.select('input.section.instructor').property('value', d.instructor)
  d3.select('input.section.location').property('value', d.location)
  d3.select('input.section.duration').property('value', d.duration)
  d3.select('input.section.start.time').property('value', d.startTimeStr)
  d3.selectAll('input.days-checkbox').property('checked', false)
  d.days.forEach(d =>
    d3.select(`input.days-checkbox[value=${d}`).property('checked', true)
  )
}
/**
 *
 * @param {String} s time as hh:mm
 * @param {String} base_date a date string as yyyy-mm-dd
 * @returns {Date}
 */
function time_to_date(s, base_date = '2000-01-01') {
  return new Date(base_date + 'T' + s)
}

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60000)
}

function makeKey(d) {
  return `${d.prefix}-${d.number}-${d.section}-${d.term}`
}
