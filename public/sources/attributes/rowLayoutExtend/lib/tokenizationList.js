/* eslint react/jsx-no-bind: "off" */
import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import _ from 'lodash'
import Textarea from 'react-textarea-autosize'
import $ from 'jquery'
import 'jquery.caret'

import Token from './token'

export default class TokenizationList extends React.Component {
  static propTypes = {
    onChange: PropTypes.func.isRequired,
    value: PropTypes.string.isRequired,
    validator: PropTypes.func.isRequired,
    layouts: PropTypes.array.isRequired,
    suggestions: PropTypes.array.isRequired,
    responsiveness: PropTypes.bool,
    device: PropTypes.string,
    index: PropTypes.number
  }

  stayEditing = false
  keydownTimeout = 0

  constructor (props) {
    super(props)
    this.state = {
      value: this.props.value,
      editing: false,
      activeSuggestion: -1,
      suggestedValue: null,
      cursorPosition: null,
      // DnD
      isPressed: false,
      lastPressed: 0,
      delta: 0,
      mouse: 0
    }
    this.handleChange = this.handleChange.bind(this)
    this.handleKeyDown = this.handleKeyDown.bind(this)
    this.handleFocus = this.handleFocus.bind(this)
    this.handleBlur = this.handleBlur.bind(this)
    this.removeToken = this.removeToken.bind(this)
    this.updateValue = this.updateValue.bind(this)
    this.handleTagListClick = this.handleTagListClick.bind(this)
    this.handleSuggestionMouseDown = this.handleSuggestionMouseDown.bind(this)
  }

  componentWillReceiveProps (nextProps) {
    this.setState({ value: nextProps.value })
  }

  componentWillUnmount () {
    if (this.keydownTimeout) {
      window.clearTimeout(this.keydownTimeout)
      this.keydownTimeout = 0
    }
  }

  componentDidMound () {
    this.updateSuggestBoxPosition()
  }

  componentDidUpdate () {
    this.updateSuggestBoxPosition()
  }

  updateSuggestBoxPosition () {
    if (this.state.editing === false) {
      return
    }

    const box = this.refs.suggestBox
    const boxRect = box ? box.getBoundingClientRect() : null

    if (boxRect) {
      const windowHeight = window.innerHeight
      const bottomOffset = windowHeight - boxRect.top - boxRect.height

      if (bottomOffset < 0) {
        box.style.left = `${boxRect.left + 10}px`

        if (windowHeight < boxRect.height) {
          box.style.top = '0px'
          box.style.maxHeight = `${windowHeight}px`
        } else {
          box.style.top = `${boxRect.top + bottomOffset - 1}px`
        }
      }
    }
  }

  handleChange (e) {
    this.updateValue(e.target.value)
  }

  updateCursorPosition (el) {
    this.keydownTimeout = setTimeout(() => {
      let caret = $(el).caret('offset')
      let offset = el.getBoundingClientRect()
      this.setState({
        cursorPosition: {
          top: offset.top + offset.height,
          left: caret.left
        }
      })
    }, 10)
  }

  handleKeyDown (e) {
    let key = e.which || e.keyCode
    let updateCursorPosition = true
    if (key === 40) {
      e.preventDefault()
      this.setActiveSuggestion(1)
      updateCursorPosition = false
    } else if (key === 38) {
      e.preventDefault()
      this.setActiveSuggestion(-1)
      updateCursorPosition = false
    } else if (key === 13 && this.state.activeSuggestion > -1) {
      this.updateValue(this.state.suggestedValue)
    } else if (key === 13) {
      e.target.blur()
      this.setState({ editing: false })
    }
    updateCursorPosition && this.updateCursorPosition(e.target)
  }

  handleFocus (e) {
    this.setState({ editing: true })
    this.updateCursorPosition(e.target)
  }

  handleBlur (e) {
    if (this.stayEditing === false) {
      this.setState({ editing: false })
    } else {
      e.currentTarget.focus()
      this.stayEditing = false
    }
    if (this.state.suggestedValue && (this.state.value !== this.state.suggestedValue)) {
      this.updateValue(this.state.suggestedValue)
    }
  }

  handleSuggestionMouseDown (e) {
    let value = this.state.value + e.currentTarget.getAttribute('data-vcv-suggest')
    this.setState({ value: value, suggestedValue: null, activeSuggestion: -1 })
    let layoutSplit = this.getLayout(value)
    this.props.onChange(layoutSplit)
    this.stayEditing = true
  }

  handleTagListClick (e) {
    if (e.target === e.currentTarget) {
      this.handleFocus({ target: e.currentTarget.previousSibling })
      e.currentTarget.previousSibling.focus()
    }
  }

  updateValue (value) {
    this.setState({ value: value, suggestedValue: null, activeSuggestion: -1 })
    const layoutSplit = this.props.device ? value : this.getLayout(value)
    const options = this.props.device ? {
      device: this.props.device,
      index: this.props.index
    } : false
    this.props.onChange(layoutSplit, options)
  }

  setActiveSuggestion (incr) {
    let suggestions = this.getSuggestions()
    let index = this.state.activeSuggestion + incr
    if (suggestions[ index ] !== undefined) {
      this.setState({ activeSuggestion: index, suggestedValue: this.state.value + suggestions[ index ] })
    }
  }

  getLayout (layout) {
    layout = layout.match(/\+$/) ? layout.replace(/\s+\+$/, '') : layout
    if (layout.match(/^[\s++]/)) {
      layout = layout.replace(/^[\s++]+/, '')
    }
    let columns = layout.split(/[\s+;]+/)
    return _.flatten(columns.map((column, index) => {
      if (index < columns.length - 1) {
        let size = column.match(/^\d+$/) ? parseInt(column) : 0
        if (size > 0 && size <= 10) {
          let size = parseInt(column)
          column = []
          for (let i = 1; i <= size; i++) {
            column.push(`1/${size}`)
          }
        }
      }
      return column
    }))
  }

  removeToken (index) {
    let tokens = this.getLayout(this.state.value)
    let removedToken = tokens.splice(index, 1)
    removedToken && this.updateValue(tokens.join(' + '))
  }

  getTokensList () {
    let tokens = _.compact(this.getLayout(this.state.value))
    return tokens.map((token, index) => {
      return <Token
        key={'vcvToken' + index}
        title={token}
        removeCallback={this.removeToken}
        valid={this.props.validator(token)}
        index={index}
      />
    })
  }

  getSuggestions () {
    return this.state.value.length === 0 || this.state.value.match(/\+\s+$/) ? this.props.suggestions : []
  }

  getSuggestionItems () {
    let suggestions = this.getSuggestions()
    return suggestions.map((item, index) => {
      let isActive = index === this.state.activeSuggestion
      let cssClasses = classNames({
        'vcv-ui-suggest-box-item': true,
        'vcv-selected': isActive
      })
      return <span key={'vcvSuggestBoxItem' + index}
        className={cssClasses}
        onMouseDown={this.handleSuggestionMouseDown}
        data-vcv-suggest={item}
      >
        {item}
      </span>
    })
  }

  renderTokensList () {
    if (this.state.editing) {
      return null
    }
    let tokens = this.getTokensList()
    return <div className='vcv-ui-tag-list vcv-ui-form-input' onClick={this.handleTagListClick}>
      {tokens}
    </div>
  }

  renderSuggestionBox () {
    if (this.state.editing === false) {
      return null
    }
    let items = this.getSuggestionItems()
    if (!items.length) {
      return null
    }
    let cssClasses = classNames({
      'vcv-ui-suggest-box': true,
      'vcv-ui-form-input': true
    })

    return <div className={cssClasses} style={this.state.cursorPosition} ref={'suggestBox'}>
      {items}
    </div>
  }

  render () {
    let cssClasses = classNames({
      'vcv-ui-form-input': true,
      'vcv-ui-tag-list-input': true,
      'vcv-ui-tag-list-input-editing-disabled': !this.state.editing && !this.props.responsiveness
    })
    const tokensList = !this.props.responsiveness ? this.renderTokensList() : null
    return <div className='vcv-ui-tag-list-container'>
      <Textarea
        minRows={1}
        className={cssClasses}
        type='text'
        onChange={this.handleChange}
        onKeyDown={this.handleKeyDown}
        value={this.state.suggestedValue || this.state.value}
        onFocus={this.handleFocus}
        onBlur={this.handleBlur}
        data-vcv-type='vcv-tokenized-input'
      />
      {tokensList}
      {this.renderSuggestionBox()}
    </div>
  }
}