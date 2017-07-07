import React from 'react'

import Attribute from '../attribute'
import TokenizationList from './lib/tokenizationList'

export default class AutoComplete extends Attribute {

  validate (state) {
    return state
  }

  render () {
    return (
      <TokenizationList
        onChange={this.setFieldValue}
        value={this.props.value}
        fieldKey={this.props.fieldKey}
        element={this.props.element}
        validator={this.validate}
        validation={this.props.options.validation}
      />
    )
  }
}