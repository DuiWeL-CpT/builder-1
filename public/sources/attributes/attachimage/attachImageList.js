import React from 'react'
import AttachImageItem from './attachImageItem'
import {SortableElement, SortableHandle} from 'react-sortable-hoc'

const SortableHandler = SortableHandle(({ title }) => {
  return (
    <a className='vcv-ui-form-attach-image-item-control' title={title}>
      <i className='vcv-ui-icon vcv-ui-icon-move' />
    </a>
  )
})

const SortableItem = SortableElement((props) => {
  return (
    <AttachImageItem {...props} />
  )
})

export default class AttachImageList extends React.Component {
  static propTypes = {
    value: React.PropTypes.oneOfType([ React.PropTypes.string, React.PropTypes.object, React.PropTypes.array ]).isRequired,
    fieldKey: React.PropTypes.string.isRequired
  }

  constructor (props) {
    super(props)
    this.handleOpenLibrary = this.handleOpenLibrary.bind(this)
  }

  handleOpenLibrary () {
    this.props.openLibrary()
  }

  render () {
    const localizations = window.VCV_I18N && window.VCV_I18N()
    const addImage = localizations ? localizations.addImage : 'Add Image'
    const editReplaceImage = localizations ? localizations.editReplaceImage : 'Edit or Replace Image'
    const moveImage = localizations ? localizations.moveImage : 'Move Image'
    let { fieldKey, value } = this.props
    let images = []

    let oneMoreControl = ''
    if (this.props.options.multiple) {
      oneMoreControl = (
        <SortableHandler title={moveImage} />
      )
    } else {
      oneMoreControl = (
        <a className='vcv-ui-form-attach-image-item-control' onClick={this.handleOpenLibrary.bind(this)}
          title={editReplaceImage}>
          <i className='vcv-ui-icon vcv-ui-icon-edit' />
        </a>
      )
    }

    value && value.urls && value.urls.forEach((url, index) => {
      let childProps = {
        key: index,
        fieldKey: fieldKey,
        url: url,
        oneMoreControl: oneMoreControl,
        handleRemove: this.props.handleRemove,
        getUrlHtml: this.props.getUrlHtml
      }

      if (this.props.options.multiple) {
        value.ids[ index ] && images.push(
          <SortableItem
            key={`sortable-attach-image-item-${fieldKey}-${index}`}
            childProps={childProps}
            index={index}
          />
        )
      } else {
        value.ids[ index ] && images.push(
          <AttachImageItem
            key={index}
            childProps={childProps}
          />
        )
      }
    })

    let addControl = (
      <li className='vcv-ui-form-attach-image-item'>
        <a className='vcv-ui-form-attach-image-control' onClick={this.handleOpenLibrary.bind(this)} title={addImage}>
          <i className='vcv-ui-icon vcv-ui-icon-add' />
        </a>
      </li>
    )

    if (!this.props.options.multiple && value.urls && value.urls.length && value.ids[ 0 ]) {
      addControl = ''
    }

    return (
      <ul className='vcv-ui-form-attach-image-items'>
        {images}
        {addControl}
      </ul>
    )
  }
}
