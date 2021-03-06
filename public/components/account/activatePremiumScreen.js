import React from 'react'
import VCVLogo from './vcvLogo'
import VersionBox from './versionBox'
import { env, getService } from 'vc-cake'
import { getResponse } from 'public/tools/response'

const dataProcessor = getService('dataProcessor')

export default class ActivatePremiumScreen extends React.Component {
  static localizations = window.VCV_I18N && window.VCV_I18N()

  constructor (props) {
    super(props)
    this.activationContent = React.createRef()

    this.state = {
      licenseValue: '',
      hasError: false,
      errorText: ''
    }

    this.handleInputChange = this.handleInputChange.bind(this)
    this.handleInputFocus = this.handleInputFocus.bind(this)
    this.setError = this.setError.bind(this)
  }

  componentDidMount () {
    setTimeout(() => {
      this.activationContent.current && this.activationContent.current.classList.add('vcv-activation-content--active')
    }, 200)
  }

  handleInputChange (e) {
    const val = e.currentTarget && e.currentTarget.value

    this.setState({
      licenseValue: val
    })
  }

  handleActivateClick (type, e) {
    e.preventDefault()
    this.setState({
      hasError: false,
      errorText: ''
    })
    if (this.state.licenseValue) {
      this.setState({
        loading: type
      })
      dataProcessor.appAdminServerRequest({
        'vcv-action': 'license:activate:adminNonce',
        'vcv-license-key': this.state.licenseValue,
        'vcv-activation-type': type || 'premium'
      }).then((responseData) => {
        let response = getResponse(responseData)
        if (response && response.status) {
          const updateUrl = window.VCV_UPDATE_URL && window.VCV_UPDATE_URL()
          if (updateUrl) {
            window.location.href = updateUrl
          } else {
            window.location.reload()
          }
        } else {
          this.setError(response && response.message ? response.message : '')
          console.warn(response)
        }
      }, (error) => {
        this.setError()
        console.warn(error)
      })
    } else {
      this.setState({
        hasError: true
      })
    }
  }

  setError (errorText) {
    if (errorText) {
      this.setState({ errorText })
    }
    this.setState({
      hasError: true,
      loading: false
    })
  }

  handleInputFocus () {
    this.setState({ hasError: false })
  }

  getListItemClass (activationType) {
    return activationType === 'free' ? 'vcv-basic-list-item vcv-basic-list-item--not-included' : 'vcv-basic-list-item'
  }

  render () {
    const { hasError, errorText, loading } = this.state
    const { activationType } = this.props
    let stagingButton = null

    if (activationType !== 'free' && window.VCV_STAGING_AVAILABLE && window.VCV_STAGING_AVAILABLE()) {
      let buttonClasses = 'vcv-activation-button vcv-activation-button--dark'
      if (loading === 'staging') {
        buttonClasses += ' vcv-activation-button--loading'
      }
      const activateStagingText = ActivatePremiumScreen.localizations ? ActivatePremiumScreen.localizations.activateStaging : 'Activate Staging'
      stagingButton = <div className='vcv-activation-button-container'>
        <button className={buttonClasses} onClick={this.handleActivateClick.bind(this, 'staging')}>
          {activateStagingText}
        </button>
      </div>
    }

    let inputClasses = 'vcv-basic-input'
    if (hasError) {
      inputClasses += ' vcv-ui-form-input--error'
    }

    let errorBox = null
    if (errorText) {
      errorBox = <div className='vcv-activation-box-error-box'>
        {errorText}
      </div>
    }

    let premiumButtonClasses = 'vcv-activation-button'
    if (loading === 'premium' || loading === 'free') {
      premiumButtonClasses += ' vcv-activation-button--loading'
    }

    let activationBoxClasses = 'vcv-activation-box-container vcv-activation-box-container-premium'
    if (loading) {
      activationBoxClasses += ' vcv-activation--loading'
    }

    const getPremiumFeaturesText1 = ActivatePremiumScreen.localizations ? ActivatePremiumScreen.localizations.getPremiumFeaturesText1 : 'Get Premium Elements, Templates,'
    const getPremiumFeaturesText2 = ActivatePremiumScreen.localizations ? ActivatePremiumScreen.localizations.getPremiumFeaturesText2 : 'Extensions, and Support'
    const getFreeAccessText = ActivatePremiumScreen.localizations ? ActivatePremiumScreen.localizations.getFreeAccessToTheVisualComposerHub : 'Get Free Access to the Visual Composer Hub'
    const whatYouWillGetText = ActivatePremiumScreen.localizations ? ActivatePremiumScreen.localizations.whatYouWillGet : 'What You Will Get?'
    const whatYouWillGetForFreeText = ActivatePremiumScreen.localizations ? ActivatePremiumScreen.localizations.whatYouWillGetForFree : 'What You Will Get For Free?'
    const limitedAccessToExtensionsText = ActivatePremiumScreen.localizations ? ActivatePremiumScreen.localizations.limitedAccessToExtensions : 'Limited access to the Visual Composer Hub of elements, templates, and extensions'
    const themeBuilderWithHFSText = ActivatePremiumScreen.localizations ? ActivatePremiumScreen.localizations.themeBuilderWithHFS : 'Theme builder with Header, Footer, and Sidebar editor'
    const wooCommerceCompatibilityText = ActivatePremiumScreen.localizations ? ActivatePremiumScreen.localizations.wooCommerceCompatibility : 'WooCommerce compatibility'
    const premiumSupportAndUpdatesText = ActivatePremiumScreen.localizations ? ActivatePremiumScreen.localizations.premiumSupportAndUpdates : 'Premium support and updates'
    const iWantToGoPremiumText = ActivatePremiumScreen.localizations ? ActivatePremiumScreen.localizations.iWantToGoPremium : 'I want to go premium'
    const getYourFreeLicenseText = ActivatePremiumScreen.localizations ? ActivatePremiumScreen.localizations.getYourFreeLicense : 'Get Your Free License'
    const findSubscriptionLicenseAtText = ActivatePremiumScreen.localizations ? ActivatePremiumScreen.localizations.findSubscriptionLicenseAt : 'You can find your Visual Composer Premium subscription license key by accessing our Customer Portal at'
    const findFreeLicenseAt = ActivatePremiumScreen.localizations ? ActivatePremiumScreen.localizations.findFreeLicenseAt : 'Get your free Visual Composer Hub access at'
    const activatePremiumText = ActivatePremiumScreen.localizations ? ActivatePremiumScreen.localizations.activatePremium : 'Activate Premium'
    const activateFreeText = ActivatePremiumScreen.localizations ? ActivatePremiumScreen.localizations.activateFree : 'Activate Free'

    let headingText = getFreeAccessText

    if (activationType === 'premium') {
      headingText = (
        <React.Fragment>
          {getPremiumFeaturesText1}<br />
          {getPremiumFeaturesText2}
        </React.Fragment>
      )
    }

    let activationButton
    if (activationType === 'premium') {
      activationButton = (
        <a href={window.VCV_GO_PREMIUM_URL()} target='_blank' className='vcv-activation-button vcv-activation-button--dark'>
          {iWantToGoPremiumText}
        </a>
      )
    } else {
      activationButton = (
        <a href={window.VCV_GO_FREE_URL()} target='_blank' className='vcv-activation-button vcv-activation-button--dark'>
          {getYourFreeLicenseText}
        </a>
      )
    }

    let findNewLicenseAtText
    if (activationType === 'premium') {
      findNewLicenseAtText = (
        <React.Fragment>{findSubscriptionLicenseAtText}
          <a href={window.VCV_GO_PREMIUM_URL()} className='vcv-activation-link' target='_blank'>{env('VCV_HUB_URL').replace(/^https:\/\//i, ' ').replace(/\/$/, '')}</a>
        </React.Fragment>
      )
    } else {
      findNewLicenseAtText = (
        <React.Fragment>
          {findFreeLicenseAt}
          <a href={window.VCV_GO_FREE_URL()} className='vcv-activation-link' target='_blank'>{env('VCV_HUB_URL').replace(/^https:\/\//i, ' ').replace(/\/$/, '')}</a>
        </React.Fragment>
      )
    }

    return (
      <div className='vcv-activation-content' ref={this.activationContent}>
        <VCVLogo />
        <VersionBox />
        <p className='vcv-activation-heading'>
          {headingText}
        </p>
        <div className={activationBoxClasses}>
          <div className='vcv-activation-box'>
            <h3 className='vcv-activation-box-heading'>
              {activationType === 'premium' ? whatYouWillGetText : whatYouWillGetForFreeText}
            </h3>
            <ul className='vcv-basic-list'>
              <li className='vcv-basic-list-item'>{limitedAccessToExtensionsText}</li>
              <li className={this.getListItemClass(activationType)}>{themeBuilderWithHFSText}</li>
              <li className={this.getListItemClass(activationType)}>{wooCommerceCompatibilityText}</li>
              <li className={this.getListItemClass(activationType)}>{premiumSupportAndUpdatesText}</li>
            </ul>
            <div className='vcv-activation-button-container'>
              {activationButton}
            </div>
          </div>
          <div className='vcv-activation-box'>
            {errorBox}
            <div className='vcv-basic-input-container--password'>
              <input placeholder='Enter your license key' className={inputClasses} required='' name='licenseKey' type='text' value={this.state.licenseValue} onChange={this.handleInputChange} maxLength='36' onFocus={this.handleInputFocus} />
            </div>
            <div className='vcv-activation-input-description'>
              {findNewLicenseAtText}
            </div>
            <div className='vcv-activation-button-container'>
              <button className={premiumButtonClasses} onClick={this.handleActivateClick.bind(this, activationType)}>
                {activationType === 'premium' ? activatePremiumText : activateFreeText}
              </button>
            </div>
            {stagingButton}
          </div>
        </div>
      </div>
    )
  }
}
