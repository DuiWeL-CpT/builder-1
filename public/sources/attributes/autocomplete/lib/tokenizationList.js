/* eslint react/jsx-no-bind: "off" */
import React from 'react'
import vcCake from 'vc-cake'
import classNames from 'classnames'
import _ from 'lodash'
import Textarea from 'react-textarea-autosize'
import 'jquery.caret'
import $ from 'jquery'

import Token from './token'

export default class TokenizationList extends React.Component {

  static propTypes = {
    validator: React.PropTypes.func.isRequired,
    validation: React.PropTypes.bool.isRequired
  }

  keydownTimeout = 0

  constructor (props) {
    super(props)
    let value = this.props.value
    if (!Array.isArray(value)) {
      value = value ? [ value ] : []
    }
    this.state = {
      value: value,
      editing: false,
      loading: false,
      validating: this.props.validation,
      inputValue: '',
      suggestedItems: [],
      loadTokenLabels: [],
      activeSuggestion: -1,
      suggestedValue: null,
      cursorPosition: null,
      addedSuggested: false
    }
    this.handleChange = this.handleChange.bind(this)
    this.handleFocus = this.handleFocus.bind(this)
    this.handleBlur = this.handleBlur.bind(this)
    this.removeToken = this.removeToken.bind(this)
    this.handleTagListClick = this.handleTagListClick.bind(this)
    this.handleSuggestionMouseDown = this.handleSuggestionMouseDown.bind(this)
    this.handleKeyDown = this.handleKeyDown.bind(this)
    this.updateValue = this.updateValue.bind(this)
  }

  handleKeyDown (e) {
    let key = e.which || e.keyCode
    let updateBoxPosition = true
    if (key === 40) {
      e.preventDefault()
      this.setActiveSuggestion(1)
      updateBoxPosition = false
    } else if (key === 38) {
      e.preventDefault()
      this.setActiveSuggestion(-1)
      updateBoxPosition = false
    } else if (key === 13 && this.state.activeSuggestion > -1) {
      e.preventDefault()
      this.updateValue(this.state.suggestedValue)
      this.setState({ addedSuggested: true })
    } else if (key === 13) {
      e.target.blur()
      this.setState({editing: false})
    }
    updateBoxPosition && this.updateBoxPosition(e.target)
  }

  updateBoxPosition (el) {
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

  setActiveSuggestion (incr) {
    let suggestions = this.state.suggestedItems
    let index = this.state.activeSuggestion + incr
    if (suggestions[index] !== undefined) {
      let value = this.state.inputValue.split(',')
      if (!this.checkValue(this.state.inputValue)) {
        value.pop()
        if (value.length > 0) {
          value = value + ', '
        }
      }
      this.setState({ activeSuggestion: index, suggestedValue: value + suggestions[ index ].value })
    }
  }

  updateValue (value) {
    let loading = true
    if (!value || this.checkValue(value)) {
      loading = false
    }

    this.setState({ inputValue: value, suggestedItems: [], callSuggestionAjax: true, loading: loading, suggestedValue: null, activeSuggestion: -1 })
  }

  handleChange (e) {
    this.updateValue(e.currentTarget.value)
    this.setState({ addedSuggested: false })
  }

  handleFocus (e) {
    this.setState({ inputValue: this.state.value.join(','), editing: true })
  }

  handleBlur (e) {
    let value = this.state.inputValue.split(',')
    this.setState({ editing: false, value: value, validating: this.props.validation })
    this.props.onChange(value)
    this.loadTokenLabels(value)
  }

  handleTagListClick (e) {
    if (e.target === e.currentTarget) {
      if (!this.state.inputValue || !this.checkValue(this.state.inputValue)) {
        this.setState({ suggestedItems: [], loading: false })
      }
      this.handleFocus({ target: e.currentTarget.previousSibling })
      e.currentTarget.previousSibling.focus()
    }
  }

  checkValue (value) {
    let val = value.split(',')
    if (!val[ val.length - 1 ].replace(/\s/g, '').length) {
      return true
    }
    return false
  }

  handleSuggestionMouseDown (e) {
    let { inputValue } = this.state
    inputValue = inputValue.split(',')
    inputValue.pop()
    inputValue.push(e.target.getAttribute('data-vcv-suggest-value'))

    this.setState({ value: inputValue, inputValue: inputValue.join(','), suggestedValue: null, activeSuggestion: -1, validating: this.props.validation })
    this.props.onChange(inputValue)
  }

  componentWillMount () {
    this.loadTokenLabels(this.state.value)
  }

  componentWillUnmount () {
    if (this.serverRequest) {
      this.serverRequest.abort()
    }
    if (this.serverRequestLabels) {
      this.serverRequestLabels.abort()
    }
  }

  componentWillUpdate (nextProps, nextState) {
    if (nextState.callSuggestionAjax && nextState.inputValue) {
      let value = nextState.inputValue.split(',')
      if (!this.checkValue(nextState.inputValue)) {
        this.loadSuggestions(value[ value.length - 1 ])
      } else {
        if (_.size(this.state.suggestedItems) > 0) {
          this.setState({ suggestedItems: [], loading: false })
        }
      }
    }
  }

  loadSuggestions (search) {
    let ajax = vcCake.getService('utils').ajax
    if (this.serverRequest) {
      this.serverRequest.abort()
    }

    this.serverRequest = ajax({
      'vcv-action': 'autoComplete:findString:adminNonce',
      'vcv-search': search.trim(),
      'vcv-nonce': window.vcvNonce,
      'vcv-tag': this.props.element.get('tag'),
      'vcv-param': this.props.fieldKey,
      'vcv-source-id': window.vcvSourceID
    }, (request) => {
      let response = JSON.parse(request.response)
      if (response.status) {
        this.setState({ suggestedItems: response.results, callSuggestionAjax: false, loading: false })
      }
    })
  }

  removeToken (index) {
    this.state.value.splice(index, 1)
    this.setState({ value: this.state.value, suggestedItems: [], loading: false })
    this.props.onChange(this.state.value)
  }

  getTokensList () {
    let tokens = this.state.value
    let reactTokens = []

    tokens.forEach((token, index) => {
      if (token && token.length > 1) {
        let title = token
        let valid = false
        if (this.state.loadTokenLabels[ token ]) {
          title = this.state.loadTokenLabels[ token ]
          valid = true
        }

        if (!this.props.validation) {
          valid = true
        }

        reactTokens.push(<Token
          key={`vcvToken-${token}-${index}`}
          title={title}
          valid={this.props.validator(valid)}
          validating={this.state.validating}
          removeCallback={this.removeToken}
          value={token}
          index={index}
        />)
      }
    })

    return reactTokens
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

  loadTokenLabels (value) {
    let ajax = vcCake.getService('utils').ajax
    if (this.serverRequestLabels) {
      this.serverRequestLabels.abort()
    }
    this.serverRequestLabels = ajax({
      'vcv-action': 'autoComplete:getTokenLabels:adminNonce',
      'vcv-tokens': value,
      'vcv-nonce': window.vcvNonce,
      'vcv-source-id': window.vcvSourceID
    }, (request) => {
      if (request.response) {
        this.setState({ loadTokenLabels: JSON.parse(request.response), validating: false })
      }
    })
  }

  renderSuggestionBox () {
    if (this.state.editing === false) {
      return null
    }
    let items = this.state.suggestedItems
    if (!items || !items.length) {
      return null
    }
    let cssClasses = classNames({
      'vcv-ui-suggest-box': true,
      'vcv-ui-form-input': true,
      'vcv-ui-autocomplete': true
    })
    let reactItems = []
    if (!this.checkValue(this.state.inputValue) && !this.state.addedSuggested) {
      this.state.suggestedItems.forEach((item, index) => {
        let isActive = index === this.state.activeSuggestion
        let cssClasses = classNames({
          'vcv-ui-suggest-box-item': true,
          'vcv-selected': isActive
        })
        reactItems.push(<span key={'vcvSuggestBoxItem' + item.value}
          className={cssClasses}
          onMouseDown={this.handleSuggestionMouseDown}
          data-vcv-suggest={item.label}
          data-vcv-suggest-value={item.value}
        >
          {item.label}
        </span>)
      })

      return <div className={cssClasses} style={this.state.cursorPosition}>
        {reactItems}
      </div>
    }
  }

  getLoading () {
    if (this.state.loading) {
      return (
        <span className='vcv-ui-icon vcv-ui-wp-spinner' />
      )
    }
  }

  render () {
    let cssClasses = classNames({
      'vcv-ui-form-input': true,
      'vcv-ui-tag-list-input': true,
      'vcv-ui-tag-list-input-editing-disabled': !this.state.editing
    })
    return <div className='vcv-ui-tag-list-container'>
      <Textarea
        minRows={1}
        className={cssClasses}
        type='text'
        onChange={this.handleChange}
        value={this.state.inputValue}
        onFocus={this.handleFocus}
        onBlur={this.handleBlur}
        data-vcv-type='vcv-tokenized-input'
        onKeyDown={this.handleKeyDown}
      />
      {this.renderSuggestionBox()}
      {this.renderTokensList()}
      {this.getLoading()}
    </div>
  }
}