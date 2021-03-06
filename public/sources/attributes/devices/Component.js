import React from 'react'
import classNames from 'classnames'
import Attribute from '../attribute'
import Dropdown from '../dropdown/Component'

export default class Devices extends Attribute {
  static defaultProps = {
    fieldType: 'devices'
  }

  constructor (props) {
    super(props)
    props.setInnerFieldStatus && props.setInnerFieldStatus()

    this.devicesSettingsHandler = this.devicesSettingsHandler.bind(this)
    this.customDevicesHandler = this.customDevicesHandler.bind(this)
  }

  /**
   * Get devices type, all or custom
   * @returns {JSX}
   */
  getDevicesSettings () {
    let options = {
      values: [
        {
          label: 'All',
          value: 'all'
        },
        {
          label: 'Custom',
          value: 'custom'
        }
      ]
    }
    return <div className='vcv-ui-form-group'>
      <Dropdown
        api={this.props.api}
        fieldKey='settings'
        options={options}
        updater={this.devicesSettingsHandler}
        value={this.state.value === 'all' ? 'all' : 'custom'} />
    </div>
  }

  /**
   * Handle device type change
   * @param fieldKey
   * @param value
   */
  devicesSettingsHandler (fieldKey, value) {
    this.setFieldValue(value === 'custom' ? 'xl' : value)
  }

  /**
   * Check if it is custom devices
   * @returns {boolean}
   */
  isCustomDevices () {
    return this.state.value !== `all`
  }

  /**
   * Get custom devices JSX
   * @returns {*}
   */
  getCustomDevices () {
    let { fieldKey } = this.props
    let returnData = null
    if (this.isCustomDevices()) {
      let customDevices = [
        {
          label: 'Desktop',
          value: 'xl',
          icon: 'vcv-ui-icon-desktop'
        },
        {
          label: 'Tablet Landscape',
          value: 'lg',
          icon: 'vcv-ui-icon-tablet-landscape'
        },
        {
          label: 'Tablet Portrait',
          value: 'md',
          icon: 'vcv-ui-icon-tablet-portrait'
        },
        {
          label: 'Mobile Landscape',
          value: 'sm',
          icon: 'vcv-ui-icon-mobile-landscape'
        },
        {
          label: 'Mobile Portrait',
          value: 'xs',
          icon: 'vcv-ui-icon-mobile-portrait'
        }
      ]
      if (this.props.options && this.props.options.customDevices) {
        customDevices = this.props.options.customDevices
      }

      let devices = []
      customDevices.forEach((device) => {
        let classes = classNames({
          'vcv-ui-form-button': true,
          'vcv-ui-form-button--active': this.state.value === device.value
        })
        let icon = classNames([
          'vcv-ui-form-button-icon',
          'vcv-ui-icon',
          device.icon
        ])
        devices.push(
          <button type='button' className={classes} title={device.label}
            key={`${fieldKey}:${device.value}`}
            onClick={this.customDevicesHandler}
            value={device.value}>
            <i className={icon} />
          </button>
        )
      })

      returnData = (
        <div className='vcv-ui-col vcv-ui-col--fixed-width'>
          <div className='vcv-ui-form-buttons-group vcv-ui-form-group vcv-ui-form-button-group--attribute vcv-ui-form-devices'>
            {devices}
          </div>
        </div>
      )
    }
    return returnData
  }

  /**
   * Handle custom device change
   * @param event
   */
  customDevicesHandler (event) {
    let value = event && event.currentTarget.value
    this.setFieldValue(value)
  }

  render () {
    return (
      <div className='vcv-ui-row vcv-ui-row-gap--md'>
        <div className='vcv-ui-col vcv-ui-col--fixed-width'>
          {this.getDevicesSettings()}
        </div>
        {this.getCustomDevices()}
      </div>
    )
  }
}
