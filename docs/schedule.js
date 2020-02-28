/**
 *
 * @param {array of objects} d
 */

// 'startTimeStr',
// 'duration',
// 'days',
// 'day',
// 'sectionID',
//   'sessionID',

function loadFile(d) {
  // console.log('loading file...')
  // console.log(d)
  if (window.File && window.FileReader && window.FileList && window.Blob) {
    // Great success! All the File APIs are supported.
  } else {
    alert('The File APIs are not fully supported in this browser.')
  }

  let f = event.target.files[0] // FileList object
  console.log(f)
  let reader = new FileReader()
  if (/csv/.test(f.type)) {
    reader.onload = function(event) {
      load_csv(event.target.result)
    }
  } else {
    reader.onload = function(event) {
      load_json(event.target.result)
    }
  }
  // Read in the file as a data URL.
  reader.readAsDataURL(f)
}

function load_json(fileHandler) {
  // console.log('reading json')
  d3.json(fileHandler, recodeJSON).then(d => {
    d.forEach(d => (d.startTime = new Date(d.startTime)))
    d.forEach(d => (d.endTime = new Date(d.endTime)))
    d.forEach(d => (d.load = +d.load))
    d.forEach(d => (d.sectionID = makeKey(d)))
    d.forEach(d => (d.sessionID = makeKey(d) + '-' + d.day))
    schedule = d // .map(fix_days)
    renderSchedule([])
    renderSchedule(schedule)
  })
}
function load_csv(fileHandler) {
  // console.log('reading csv')
  d3.csv(fileHandler).then(d => {
    console.log(d)
    renderSchedule([])
    schedule = sections_to_sessions(d)
    renderSchedule(schedule)
  })
}

function recodeJSON() {
  // console.log('recoding JSON')
  d.duration = +d.duration // make sure it is numeric
  d.startTime = new Date(d.startTime)
  d.endTime = new Date(d.endTime)
}

function rename_report_data(d) {
  let res = {
    term: d.Term,
    dept: d.Department,
    academic_year: +d.AcademicYear,
    section: d.SectionName,
    prefix: d.SubjectCode,
    number: d.CourseNum,
    section: d.SectionCode,
    level: d.CourseLevelCode,
    credits: d.MinimumCredits,
    load: +d.FacultyLoad,
    used: +d.Used,
    day10: +d.Day10Used,
    // LocalMax,GlobalMax,RoomCapacity,
    days:
      typeof d.MeetingDays == 'string'
        ? d.MeetingDays.replace('TH', 'R').split('\n')
        : [],
    // MeetingTime,
    startDate: d.SectionStartDate,
    endDate: d.SectionEndDate,
    building:
      typeof d.Building == 'string' ? d.Building.split('\n') : undefined,
    roomNumber:
      typeof d.RoomNumber == 'string' ? d.RoomNumber.split('\n') : undefined,
    location:
      typeof d.BuildingAndRoom == 'string'
        ? d.BuildingAndRoom.split('\n')
        : undefined,
    // MeetingStart,
    // MeetingEnd,
    startTime:
      typeof d.MeetingStartInternal == 'string'
        ? d.MeetingStartInternal.split('\n').map(d => time_to_date(d))
        : undefined,
    endTime:
      typeof d.MeetingEndInternal == 'string'
        ? d.MeetingEndInternal.split('\n').map(d => time_to_date(d))
        : undefined,
    // monday: d.Monday === "M",
    // tuesday: d.Tuesday === "T",
    // wednesday: d.Wednesday === "W",
    // thursday: d.Thursday === "TH",
    // friday: d.Friday === "F",
    title: d.ShortTitle,
    instructor: d.Faculty,
    status: d.SectionStatus,
    method: d.InstructionalMethod,
  }

  res.days = res.days.map(s => (typeof s == 'string' ? s.split('') : s))
  // console.log(res.days);
  if (false) {
    for (let r = 0; r < res.days.length; r++) {
      let n = res.days[r].length
      ;[
        'building',
        'room_number',
        'location',
        'start_time',
        'end_time',
      ].forEach(item => {
        // console.log({ r: r, item : item, "res[item]" : res[item] });
        res[item][r] = Array(n).fill(
          res[item] == undefined ? undefined : res[item][r]
        )
      })
    }
  }

  ;['building', 'room', 'location', 'startTime', 'endTime'].forEach(item =>
    res[item] == undefined ? undefined : (res[item] = res[item].flat())
  )

  return res
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

const time_options = {
  // year: '2-digit', month: '2-digit',
  // day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  // timeZoneName: 'short'
}

const date_to_time = new Intl.DateTimeFormat('en-us', time_options).format

/**
 *
 * @param {array of objects} data section-level schedule data
 * @returns {array of objects} session-level schedule data
 */
function sections_to_sessions(data) {
  data = JSON.parse(JSON.stringify(data))
  data = canonical_sections(data)
  var sessions = []
  tidy_sections(data)
  console.log(data)
  data.forEach(function(row) {
    row.days.forEach(function(day) {
      sessions.push({
        term: row.term,
        // dept: row.dept,
        // academic_year: row.academic_year,
        section: row.section,
        prefix: row.prefix,
        number: row.number,
        level: row.level,
        sectionID: section_id(row),
        sessionID: section_id(row) + '-' + day,
        // section: row.section,
        level: row.level,
        // credits: row.credits,
        load: row.load,
        // used: row.used,
        day: day,
        // day10: row.day10,
        days: row.days,
        daysString: row.days.join(''),
        // building: row.building,
        // room_number: row.room_number,
        location: row.location,
        startTime: row.startTime,
        startTimeStr: date_to_time(row.startTime),
        endTime: row.endTime,
        endTimeStr: date_to_time(row.endTime),
        duration: row.duration,
        // title: row.title,
        instructor: row.instructor,
        notes: row.notes ? row.notes : '',
        // status: row.status,
        // method: row.method,
      })
    })
  })
  return sessions
}

function canonical_sections(sessions_data) {
  data = JSON.parse(JSON.stringify(sessions_data))
  fields = Object.keys(data[0])
  let is_calvin_report = fields.includes('TermStart')
  let first = x => x.split('\n')[0]
  if (is_calvin_report) {
    data.forEach(row => {
      console.log(row)
      row.term = row.Term.split('/')[1].substr(0, 1)
      if (row.term == 'I') {
        row.term = 'W'
      }
      row.prefix = row.SubjectCode
      row.number = row.CourseNum
      row.letter = row.SectionCode
      row.level = row.CourseLevelCode
      row.load = row.FacultyLoad
      row.location = first(row.BuildingAndRoom)
      row.daysStr = first(row.MeetingDays).replace('TH', 'R')
      row.days = row.daysStr.split('')
      row.startTimeStr = first(row.MeetingStartInternal)
      row.endTimeStr = first(row.MeetingEndInternal)
      row.startTime = time_to_date(row.startTimeStr)
      row.endTime = time_to_date(row.endTimeStr)
      row.duration = diffMinutes(row.endTime, row.startTime)
      row.instructor = first(row.Faculty)
      row.notes = []
      if (row.location != row.BuildingAndRoom) {
        row.notes.push('Possible missing session data.')
      }
      if (row.instructor != row.Faculty) {
        row.notes.push('Possible missing instructor data.')
      }
      row.notes = row.notes.join('\n')
    })
  }
  return data
}

function tidy_sections(data) {
  data.forEach(function(row) {
    if (row.days && typeof row.days == 'string') {
      row.days = row.days.split(',')
    }
    row.startTime = new Date(row.startTime)
    row.endTime = new Date(row.endTime)
  })
  return data
}

function session_summary(d, i) {
  return (
    '' +
    section_id(d) + // d.prefix + " " + d.number
    ' @ ' +
    date_to_time(d.startTime) +
    ' - ' +
    date_to_time(d.endTime) +
    ' on ' +
    d.day +
    '<br>' +
    ' in ' +
    d.location +
    ' with ' +
    d.instructor +
    ' [' +
    d.term +
    ']'
  )
}

function append_item(x, item) {
  if (x == undefined) {
    x = []
  }
  return x.concat(item)
}

function sessions_to_sections(data) {
  // make deep copy locally so we don't mess up day field in original data
  data = JSON.parse(JSON.stringify(data))
  result = {}
  for (i in data) {
    let d = data[i]
    let key = d.sectionID // section_id(d)
    let old = result[key]
    if (old == undefined) {
      old = {}
    }
    delete d.days
    delete d.sessionID
    result[key] = d
    result[key].days = append_item(old.days, d.day)
    delete result[key].day
    // console.log(key, result[key])
    // result[key].starts = append_item(old.starts, date_to_time(d.start_time))
    // result[key].ends = append_item(old.ends, date_to_time(d.end_time))
  }
  for (i in result) {
    let d = result[i]
    d.daysString = d.days.join('')

    // delete d.days
    // d.starts = d.starts.join(';')
    // d.ends = d.ends.join(';')
    // delete result[i].start_time
    // delete result[i].end_time
  }
  // convert to array
  result = Object.keys(result).map(k => result[k])
  // add end time as a string
  result.forEach(function(d) {
    d.endTimeStr = date_to_time(new Date(d.endTime))
  })
  return result
}

function is_session_data(data) {
  // console.log(data)
  return data.length == 0 || Object.keys(data[0]).includes('day')
}

function section_id(d) {
  return d.prefix + '-' + d.number + '-' + d.section
}

function export_json(filename = '') {
  if (!filename) {
    filename = `schedulizer-${niceDateString()}.json`
  }
  let sessions_data = d3
    .selectAll('svg#schedule-by-location rect.session')
    .data()
  // .map(fix_days)
  // let sessions_data = schedule
  // var sections_data = sessions_to_sections(sessions_data)
  // console.log(sections_data)
  // console.log(d3.csvFormat(sections_data));

  let json = 'data:text/json;charset=utf-8,' + JSON.stringify(sessions_data)
  data = encodeURI(json)
  link = document.createElement('a')
  link.setAttribute('href', data)
  link.setAttribute('download', filename)
  link.click()
}

function export_csv(filename = '') {
  if (!filename) {
    filename = `schedulizer-${niceDateString()}.csv`
  }
  let sessions_data = d3
    .selectAll('svg#schedule-by-location rect.session')
    .data()

  let sections_data = sessions_to_sections(sessions_data)
  let csv = 'data:text/csv;charset=utf-8,' + d3.csvFormat(sections_data)
  data = encodeURI(csv)
  console.log(csv)
  link = document.createElement('a')
  link.setAttribute('href', data)
  link.setAttribute('download', filename)
  link.click()
}

function niceDateString() {
  return new Date()
    .toLocaleString('en-US', { hour12: false })
    .replace(/[, /:]/g, '-')
    .replace(/--/g, '-')
}

function fix_days(d) {
  if (typeof d.days == 'string') {
    d.daysString = d.days
    d.days = d.days.split('')
  }
  return d
}

function abbrev(x) {
  return x
    .split(' ')
    .map(d => d[0])
    .join('')
}

function compute_loads(schedule) {
  let sections = sessions_to_sections(schedule)
  let loads = Array.from(
    d3.rollup(
      sections,
      v => d3.sum(v, d => +d.load),
      d => d.instructor
    )
  )
  let res = []
  for (d of loads) {
    res.push({ instructor: d[0], load: d[1] })
  }
  return res
}

function show_classes(schedule) {
  let sections = sessions_to_sections(schedule)
  let loads = Array.from(
    d3.rollup(
      sections,
      v => v.map(d => d.prefix + d.number).join(', '),
      d => d.instructor
    )
  )
  let res = []
  for (d of loads) {
    res.push({ instructor: d[0], load: d[1] })
  }
  return res
}

function tally_sections(schedule) {
  let sections = sessions_to_sections(schedule)
  let loads = Array.from(
    d3.rollup(
      sections,
      v => v.length,
      d => d.prefix,
      d => d.number,
      d => d.term
    )
  )
  let res = []
  for (d of loads) {
    res.push({ prefix: d[0], number: d[1], term: d[2], count: d[3] })
  }
  return res
}

function sort_schedule(schedule) {
  return sessions_to_sections(schedule)
    .sort((a, b) => a.term > b.term)
    .sort((a, b) => a.number - b.number)
}

function tally_courses(schedule) {
  let sectionsDF = new dataForge.DataFrame(sessions_to_sections(schedule))
  return sectionsDF
    .groupBy(
      row => row.term,
      row => row.prefix,
      row => row.number
    )
    .select(group => ({
      term: group.first().term,
      prefix: group.first().prefix,
      number: group.first().number,
      // total_load: group.select(row => row.load).sum(),
      n_sections: group.length,
    }))
    .inflate() // Series -> dataframe.
    .toArray() // Convert to regular JS array.
}

function repair_day(schedule) {
  return schedule.map(d => {
    d.day = d.sessionID.charAt(d.sessionID.length - 1)
    return d
  })
}
