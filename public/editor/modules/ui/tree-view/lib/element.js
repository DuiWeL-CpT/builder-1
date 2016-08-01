import vcCake from 'vc-cake'
import React from 'react'
import classNames from 'classnames'

const cook = vcCake.getService('cook')
const AssetsManager = vcCake.getService('assets-manager')

class TreeViewElement extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      childExpand: true,
      elementId: null,
      hasChild: false
    }
  }

  componentDidMount () {
    this.props.api.notify('element:mount', this.props.element.id)

    this.props.api
      .reply('app:edit', (id) => {
        this.setState({ elementId: id })
      })
      .reply('app:add', (id) => {
        this.setState({ elementId: id })
      })
      .reply('bar-content-end:hide', () => {
        this.setState({ elementId: null })
      })
      .on('hide', () => {
        this.setState({ elementId: null })
      })
      .on('form:hide', () => {
        this.setState({ elementId: null })
      })
  }

  componentWillUnmount () {
    this.props.api.notify('element:unmount', this.props.element.id)
  }

  clickChildExpand () {
    this.setState({ childExpand: !this.state.childExpand })
  }

  clickAddChild (e) {
    e && e.preventDefault()
    this.props.api.request('app:add', this.props.element.id)
  }

  clickClone (e) {
    e && e.preventDefault()
    this.props.api.request('data:clone', this.props.element.id)
  }

  clickEdit (e) {
    e && e.preventDefault()
    this.props.api.request('app:edit', this.props.element.id)
  }

  clickDelete (e) {
    e && e.preventDefault()
    this.props.api.request('data:remove', this.props.element.id)
  }

  getContent () {
    if (this.props.data.length) {
      let level = this.props.level + 1
      const document = vcCake.getService('document')
      let elementsList = this.props.data.map((element) => {
        let data = document.children(element.id)
        return <TreeViewElement element={element} data={data} key={element.id} level={level} api={this.props.api} />
      }, this)
      return <ul className='vcv-ui-tree-layout-node'>{elementsList}</ul>
    }
    return ''
  }

  render () {
    let element = cook.get(this.props.element)
    let treeChildClasses = classNames({
      'vcv-ui-tree-layout-node-child': true,
      'vcv-ui-tree-layout-node-expand': this.state.childExpand,
      'vcv-ui-tree-layout-node-state-draft': false
    })

    let child = element.get('type') === 'container' ? this.getContent() : ''

    this.state.hasChild = !!child

    let addChildControl = false
    if (element.get('type') === 'container') {
      addChildControl = (
        <a className='vcv-ui-tree-layout-control-action' title='Add' onClick={this.clickAddChild.bind(this)}>
          <i className='vcv-ui-icon vcv-ui-icon-add-thin'></i>
        </a>
      )
    }

    let expandTrigger = ''
    if (this.state.hasChild) {
      expandTrigger = (
        <i className='vcv-ui-tree-layout-node-expand-trigger vcv-ui-icon vcv-ui-icon-expand'
          onClick={this.clickChildExpand.bind(this)} />
      )
    }

    let childControls = <span className='vcv-ui-tree-layout-control-actions'>
      {addChildControl}
      <a className='vcv-ui-tree-layout-control-action' title='Edit' onClick={this.clickEdit.bind(this)}>
        <i className='vcv-ui-icon vcv-ui-icon-edit' />
      </a>
      <a className='vcv-ui-tree-layout-control-action' title='Clone' onClick={this.clickClone.bind(this)}>
        <i className='vcv-ui-icon vcv-ui-icon-copy' />
      </a>
      <a className='vcv-ui-tree-layout-control-action' title='Delete' onClick={this.clickDelete.bind(this)}>
        <i className='vcv-ui-icon vcv-ui-icon-close-thin' />
      </a>
    </span>

    let controlClasses = classNames({
      'vcv-ui-tree-layout-control': true,
      'vcv-ui-state--active': this.props.element.id === this.state.elementId
    })

    let publicPath = AssetsManager.getPublicPath(element.get('tag'), element.get('meta_icon'))
    let space = 0.8

    return (
      <li className={treeChildClasses} data-vc-element={this.props.element.id} type={element.get('type')}
        name={element.get('name')}>
        <div className={controlClasses} style={{ paddingLeft: (space * this.props.level + 1) + 'rem' }}>
          <div className='vcv-ui-tree-layout-control-drag-handler vcv-ui-drag-handler'>
            <i className='vcv-ui-drag-handler-icon vcv-ui-icon vcv-ui-icon-drag-dots' />
          </div>
          <div className='vcv-ui-tree-layout-control-content'>
            {expandTrigger}
            <i className='vcv-ui-tree-layout-control-icon'><img src={publicPath} className='vcv-ui-icon' alt='' /></i>
            <span className='vcv-ui-tree-layout-control-label'>
              <span>{element.get('name')}</span>
            </span>
            {childControls}
          </div>
        </div>
        {child}
      </li>
    )
  }
}
TreeViewElement.propTypes = {
  element: React.PropTypes.oneOfType([ React.PropTypes.object, React.PropTypes.bool ]),
  data: React.PropTypes.oneOfType([ React.PropTypes.object, React.PropTypes.array ]),
  api: React.PropTypes.object.isRequired,
  level: React.PropTypes.number
}

module.exports = TreeViewElement
