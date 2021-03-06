import React from 'react'
import classNames from 'classnames'
import Attribute from '../attribute'
import DynamicAttribute from '../dynamicField/dynamicAttribute'
import { env } from 'vc-cake'

export default class StringAttribute extends Attribute {
  static defaultProps = {
    fieldType: 'string'
  }

  constructor (props) {
    super(props)
    this.input = React.createRef()
  }

  render () {
    let { value } = this.state
    let { placeholder, options } = this.props
    if (!placeholder && this.props.options && this.props.options.placeholder) {
      placeholder = this.props.options.placeholder
    }
    const inputType = options && options.inputType ? options.inputType : 'text'

    let fieldClassNames = classNames({
      'vcv-ui-form-input': true,
      'vcv-ui-form-field-dynamic': env('VCV_JS_FT_DYNAMIC_FIELDS') && options && options.dynamicField,
      'vcv-ui-form-input--error': options && options.inputType && this.input.current && !this.input.current.checkValidity()
    })
    let fieldComponent = <input
      className={fieldClassNames}
      type={inputType}
      onChange={this.handleChange}
      placeholder={placeholder}
      value={value}
      ref={this.input}
    />

    return (
      <DynamicAttribute {...this.props} setFieldValue={this.setFieldValue} value={value}>
        {fieldComponent}
      </DynamicAttribute>
    )
  }
}
