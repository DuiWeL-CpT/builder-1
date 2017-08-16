import React from 'react'
import ReactDOM from 'react-dom'
import Attribute from '../attribute'
import options from './options'

export default class InputSelect extends Attribute {
  selectChildren = null
  selectValues = null

  constructor (props) {
    super(props)
    this.state = this.updateState(this.props)

    this.handleClick = this.handleClick.bind(this)
    this.toggleSelect = this.toggleSelect.bind(this)
    this.setFieldValue = this.setFieldValue.bind(this)
    this.handleInputChange = this.handleInputChange.bind(this)
    this.handleDropdownChange = this.handleDropdownChange.bind(this)
  }

  updateState (props) {
    this.generateSelectChildren(props)
    return {
      input: props.value.input,
      select: props.value.select,
      openedSelect: false
    }
  }

  handleClick (e) {
    e && e.preventDefault()
    let list = ReactDOM.findDOMNode(this.refs.list)
    if (!list.contains(e.target)) {
      this.toggleSelect()
    }
  }

  toggleSelect () {
    if (this.state.openedSelect) {
      document.body.removeEventListener('click', this.handleClick)
    } else {
      document.body.addEventListener('click', this.handleClick)
    }
    this.setState({
      openedSelect: !this.state.openedSelect
    })
  }

  createGroup (key, groupObject, fieldKey) {
    let optionElements = []
    let {values, label} = groupObject
    let labelValue = label.replace(/\s+/g, '')
    for (let key in values) {
      if (values.hasOwnProperty(key)) {
        optionElements.push(this.createOptions(key, values, fieldKey))
      }
    }
    return <optgroup key={fieldKey + ':' + key + ':' + labelValue} label={label}>{optionElements}</optgroup>
  }

  createOptions (key, values, fieldKey, type) {
    let value = values[key].value
    let label = values[key].label
    if (type === 'large') {
      let displayValue = value.replace('_', '')
      let itemClasses = 'vcv-ui-form-input-select-item'
      if (this.props.value.select === value) {
        itemClasses += ' vcv-ui-form-input-select-item-active'
      }
      return (
        <div
          key={fieldKey + ':' + key + ':' + value}
          onClick={this.hangleLargeListClick.bind(this, value)}
          className={itemClasses}>
          <span>
            {displayValue} {label}
          </span>
        </div>
      )
    } else {
      return <option key={fieldKey + ':' + key + ':' + value} value={value}>{label}</option>
    }
  }

  getSelectOptions (props) {
    if (!props) {
      props = this.props
    }
    let {values} = props.options || {}
    let {global} = props.options || {}
    if (global && (!values || !values.length)) {
      values = window[global] || []
    }

    return values
  }

  getDefaultOptions (props) {
    if (!props) {
      props = this.props
    }
    let {type} = props.options || ''
    if (type && options[type]) {
      return options[type]
    }
    return []
  }

  generateSelectChildren (props) {
    let optionElements = []
    let defaultValues = this.getDefaultOptions(props)
    let values = this.selectValues = [...defaultValues, ...this.getSelectOptions(props)]
    let {fieldKey} = props
    let type = props.options && (props.options.type === 'currency' || props.options.large) ? 'large' : 'small'

    for (let key in values) {
      if (values.hasOwnProperty(key)) {
        if (values[key].hasOwnProperty('group') && type === 'small') {
          optionElements.push(this.createGroup(key, values[key].group, fieldKey))
        } else {
          optionElements.push(this.createOptions(key, values, fieldKey, type))
        }
      }
    }

    this.selectChildren = optionElements
  }

  handleInputChange (event) {
    this.setFieldValue('input', event.target.value)
  }

  handleDropdownChange (event) {
    this.setFieldValue('select', event.target.value)
  }

  hangleLargeListClick (value) {
    this.toggleSelect()
    this.setFieldValue('select', value)
  }

  setFieldValue (key, value) {
    let {updater, fieldKey} = this.props
    let {input, select} = this.state
    let updatedValues = {
      input,
      select,
      [key]: value
    }
    updater(fieldKey, updatedValues)
    this.setState({
      [key]: value,
      openedSelect: false
    })
  }

  getSelect (props) {
    if (!props) {
      props = this.props
    }
    if (props.options && (props.options.type === 'currency' || props.options.large)) {
      let displayValue = this.state.select.replace('_', '')
      return (
        <div
          className='vcv-ui-form-dropdown'
          onClick={this.toggleSelect}>
          {displayValue}
        </div>
      )
    } else {
      return (
        <select
          value={this.state.select}
          onChange={this.handleDropdownChange}
          className='vcv-ui-form-dropdown'>
          {this.selectChildren}
        </select>
      )
    }
  }

  render () {
    let {input, openedSelect} = this.state
    let {placeholder} = this.props
    if (!placeholder && this.props.options && this.props.options.placeholder) {
      placeholder = this.props.options.placeholder
    }

    let Select = this.getSelect(this.props)

    return (
      <div className='vcv-ui-form-input-select'>
        <div className='vcv-ui-form-input-group'>
          <input
            className='vcv-ui-form-input'
            type='text'
            onChange={this.handleInputChange}
            placeholder={placeholder}
            value={input}
          />
          {Select}
        </div>
        {openedSelect ? (
          <div className='vcv-ui-form-input-select-list' ref='list'>
            {this.selectChildren}
          </div>)
          : null
        }
      </div>
    )
  }
}
