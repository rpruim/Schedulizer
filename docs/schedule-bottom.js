// javascrtipt to run after HTML has been processed.

// declarations and initialization
let schedule = []
let morphTime = 1000
let width = window.innerWidth * 0.9
let height = window.innerHeight * 0.3
let termHeight = height * 0.3
let roomScale, instructorScale, timeScale, colorScale

// setup
d3.select('div.instructor').remove()
resize()
updateScales(schedule)

// add functionality to clicking "Add Section"

d3.select('button.section.add').on('click', () => {
  let days = checkBoxes('input.days-checkbox')
  let desc = days.map(d => ({
    prefix: d3.select('input.section.prefix').property('value'),
    number: d3.select('input.section.number').property('value'),
    section: d3.select('input.section.letter').property('value'),
    instructor: d3.select('input.section.instructor').property('value'),
    startTimeStr: d3.select('input.section.start.time').property('value'),
    startTime: time_to_date(
      d3.select('input.section.start.time').property('value')
    ),
    duration: d3.select('input.section.duration').property('value'),
    endTime: addMinutes(
      time_to_date(d3.select('input.section.start.time').property('value')),
      d3.select('input.section.duration').property('value')
    ),
    room: d3.select('input.section.room').property('value'),
    term: d3.select('input[name="term"]:checked').property('value'),
    day: d,
    sectionID: 'foo',
  }))
  desc.forEach(d => (d.sectionID = makeKey(d)))
  console.log(desc)
  addSessions(desc)
})

/**
 *
 * @param {String} selection d3 slection string
 *
 * side:effect: set height/width of selected elements relative to browser size
 */
function resize(selection = 'svg') {
  width = Math.round(window.innerWidth * 0.5)
  height = Math.round(window.innerHeight * 0.6)
  d3.selectAll(selection)
    .attr('width', width)
    .attr('height', height)
}

function updateScales(schedule) {
  roomScale = d3
    .scaleBand()
    .domain(schedule.map(d => d.room))
    .range([0, width])
    .padding(0.1)

  dayInRoomScale = d3
    .scaleBand()
    .domain(['M', 'T', 'W', 'R', 'F'])
    .range([0, roomScale.bandwidth()])
    .padding(0.05)

  instructorScale = d3
    .scaleBand()
    .domain(schedule.map(d => d.instructor))
    .range([0, width])
    .padding(0.1)

  dayInInstructorScale = d3
    .scaleBand()
    .domain(['M', 'T', 'W', 'R', 'F'])
    .range([0, instructorScale.bandwidth()])
    .padding(0.05)

  termScale = d3
    .scaleBand()
    .domain(schedule.map(d => d.term))
    .range([height, 0])
    .padding(0.1)

  timeScale = d3
    .scaleTime()
    .domain([time_to_date('07:00'), time_to_date('21:00')])
    .range([termHeight, 0])

  colorScale = d => 'navy'
}

// add array of sessions
/**
 *
 * @param {array of Objects} desc array of session descriptions
 */
function addSessions(desc) {
  if (!desc.every(d => d.prefix.length && d.number.length && d.term.length)) {
    console.log('term, prefix, and number are required')
    return
  }
  let ids = desc.map(d => d.sectionID)
  console.log(ids)
  console.log(schedule.filter(d => ids.includes(d.sectionID)))
  schedule = schedule.filter(d => !ids.includes(d.sectionID))
  schedule.push(...desc)
  updateScales(schedule)
  let svg = d3.select('#schedule-by-room')
  svg
    .selectAll('rect.session')
    .data(schedule)
    .join(
      enter => {
        enter
          .append('rect')
          .attr('class', 'session')
          .attr('x', d => roomScale(d.room) + dayInRoomScale(d.day))
          .attr('y', d => timeScale(d.endTime) + termScale(d.term))
          .attr('width', d => dayInRoomScale.bandwidth())
          .attr('height', d => timeScale(d.startTime) - timeScale(d.endTime))
          .style('fill', d => colorScale(d))
      },
      update => {
        update
          .transition()
          .duration(morphTime)
          .attr('x', d => roomScale(d.room) + dayInRoomScale(d.day))
          .attr('y', d => timeScale(d.endTime) + termScale(d.term))
          .attr('width', d => dayInRoomScale.bandwidth())
          .attr('height', d => timeScale(d.startTime) - timeScale(d.endTime))
          .style('fill', d => colorScale(d))
      },
      exit => {
        exit
          .transition()
          .duration(morphTime)
          .remove()
      }
    )
  d3.selectAll('rect.session').on('mouseover', d => updateControls(d))
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
  d3.select('input.section.letter').property('value', d.letter)
  d3.select('input.section.instructor').property('value', d.instructor)
  d3.select('input.section.room').property('value', d.room)
  d3.select('input.section.duration').property('value', d.duration)
  d3.select('input.section.start.time').property('value', d.startTimeStr)
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
