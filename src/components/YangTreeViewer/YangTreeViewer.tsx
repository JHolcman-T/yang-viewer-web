/**
 * Copyright (c) 2024 Jakub Holcman.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 */
import useAutoAnimate, {getTransitionSizes} from "@formkit/auto-animate"
import * as React from "react"
import styles from "./styles.module.css"

interface TreeRoot {
  name: String
  "tree-root": Boolean
  modules: [Module]
}

function isTreeRoot(object: any): object is TreeRoot {
  return "name" in object && "tree-root" in object && "modules" in object
}

interface NodeBase {
  _key: Number
  keyword: String
  name: String
  description?: String
  children: [NodeBase]
  parent: NodeBase | TreeRoot
}

function isNodeBase(object: any): object is NodeBase {
  return (
    "_key" in object &&
    "keyword" in object &&
    "name" in object &&
    "children" in object &&
    "parent" in object
  )
}

interface Module extends NodeBase {
  prefix: String
  namespace: String
  "yang-version": String
  organization?: String
  contact?: String
}

function isModule(object: any): object is Module {
  return (
    "prefix" in object && "namespace" in object && "yang-version" in object && isNodeBase(object)
  )
}

interface CommonNode extends NodeBase {}

function isCommonNode(object: any): object is CommonNode {
  return isNodeBase(object)
}

function NavBar({
  currentNodeData,
  goToFn,
}: {
  currentNodeData: CommonNode | TreeRoot | Module
  goToFn: Function
}) {
  const _nodeData: any = currentNodeData
  const elementRef: any = React.useRef(null)

  // scroll to last
  React.useEffect(() => {
    elementRef.current.scrollIntoView({block: "end", behavior: "smooth"})
  })

  // get path
  const ctxPath = [_nodeData]
  let currentCtx = _nodeData
  while (Boolean(currentCtx.parent)) {
    currentCtx = currentCtx.parent
    ctxPath.push(currentCtx)
  }
  ctxPath.reverse()

  // set elements to render
  let index = 0
  const len = ctxPath.length - 1
  const elements = []
  for (let ctx of ctxPath) {
    elements.push(
      <div
        className={styles["path-element"]}
        key={index}
        onClick={() => {
          goToFn(ctx)
        }}
        {...{active: index === len ? "true" : "false"}}
        {...(index === len ? {ref: elementRef} : {})}
      >
        <span className={styles["path-element-text"]}>{ctx.name}</span>
      </div>,
    )
    index += 1
  }

  return <nav className={styles["nav-bar"]}>{elements}</nav>
}

function TreeNode({nodeData, goToFn}: {nodeData: Module | CommonNode; goToFn: Function}) {
  const _nodeData: any = nodeData
  const [folded, setFolded] = React.useState(true)
  const elementRef: any = React.useRef(null)

  function _rollAnimation(el: any, action: any, oldCoords: any, newCoords: any) {
    let keyframes: any = []

    if (action === "remain") {
      const [widthFrom, widthTo, heightFrom, heightTo] = getTransitionSizes(
        el,
        oldCoords,
        newCoords,
      )
      if (heightFrom !== heightTo) {
        keyframes = [{height: `${heightFrom}px`}, {height: `${heightTo}px`}]
      }
    }
    return new KeyframeEffect(el, keyframes, {
      duration: 500,
      easing: "ease-out",
    })
  }

  React.useEffect(() => {
    elementRef.current && useAutoAnimate(elementRef.current, _rollAnimation)
  }, [elementRef])

  const typeToIcon: any = {
    leaf: "🍁",
    container: "📂",
    notification: "📨",
    list: "📜",
    "leaf-list": "🧻",
    action: "💥",
    rpc: "📡",
    choice: "🤔",
    case: "🤓",
    module: "📦",
    submodule: "🧩",
    input: "📩",
    output: "💨",
    anyxml: "📄",
    anydata: "❓",
  }

  const elements = []
  for (let i_element of [
    "keyword",
    "name",
    "prefix",
    "namespace",
    "organization",
    "contact",
  ].entries()) {
    const index = i_element[0]
    const element = i_element[1]
    const data = _nodeData[element]
    if (data)
      elements.push(
        <tr key={index}>
          <td>{element.charAt(0).toUpperCase() + element.slice(1)}</td>
          <td style={{whiteSpace: "pre-wrap"}}>{data}</td>
        </tr>,
      )
  }
  elements.push(
    <tr key={6}>
      <td>Children count</td>
      <td>{_nodeData.children.length}</td>
    </tr>,
  )

  const scroll = () => {
    if (folded) {
      // ***Fix for smooth scrolling***
      //
      // Description:
      // enabling both scroll sanpping and scroll behavior "smooth"
      // results with not working smooth scrolling while jumping to an element in the list.
      //
      // Steps:
      // 1. Disable snapping
      // 2. Scroll to element smoothly
      // 3. Enable snapping after 500ms (wait for animation to end)
      elementRef.current.parentNode.style["scroll-snap-type"] = "initial"
      elementRef.current.parentNode.scrollTo({
        // Values:
        // treeNodeOffsetTop - treeNodesContainerOffsetTop - padding between nodes
        top: elementRef.current.offsetTop - elementRef.current.parentNode.offsetTop - 20,
        left: 0,
        behavior: "smooth",
      })
      setTimeout(() => {
        elementRef.current.parentNode.style["scroll-snap-type"] = "y proximity"
      }, 500)
    }
  }

  return (
    <div
      className={styles["tree-node"]}
      {...(_nodeData.children.length != 0 ? {"has-children": "true"} : {"has-children": "false"})}
      ref={elementRef}
    >
      <div className={styles["node-info-wrapper"]}>
        <div
          className={styles["node-info"]}
          onClick={() => {
            goToFn(_nodeData)
            setFolded(true)
          }}
        >
          <div className={styles["node-icon"]}>{typeToIcon[_nodeData.keyword]}</div>
          <span className={styles["node-identifier"]}>{_nodeData.name}</span>
        </div>
        <button
          className={styles["node-details-btn"]}
          onClick={() => {
            setFolded(!folded)
            scroll()
          }}
        >
          {folded ? "🔽" : "🔼"}
        </button>
      </div>
      {folded ? (
        <></>
      ) : (
        <div style={{display: "flex", flexDirection: "column", gap: "10px"}}>
          <details style={{whiteSpace: "pre-wrap"}}>
            <summary style={{cursor: "pointer"}}>Description</summary>
            {_nodeData.description}
          </details>
          <div style={{overflowX: "auto"}}>
            <table style={{margin: "unset", display: "table", width: "100%"}}>
              <tbody>{elements}</tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function initTree(node: TreeRoot | Module | CommonNode): TreeRoot | Module | CommonNode {
  // Add parent reference for all children nodes
  let children

  if (isTreeRoot(node)) {
    children = node.modules
  } else {
    children = node.children
  }

  for (let child of children) {
    child.parent = node
    initTree(child)
  }
  return node
}

export default function YangTreeViewer({
  tree,
  "sm-sort": smSort,
  css = "standard",
}: {
  tree: TreeRoot
  "sm-sort": String
  css: "docusaurus" | "custom" | "standard"
}) {
  const _smSort = String(smSort) === "true"
  const _cachedTree = React.useMemo(() => initTree(tree), [tree])
  const [_currentNode, setCurrentNode] = React.useState(_cachedTree)

  function goToFn(node: any) {
    // sets current node state
    if (getChildren(node).length !== 0) setCurrentNode(node)
  }

  function getChildren(node: any) {
    let children = node.children
    if (node["tree-root"] === true) {
      children = node.modules
    }
    return children
  }

  let children = getChildren(_currentNode)

  if (isTreeRoot(_currentNode) && _smSort === true) {
    children.sort((a: any, b: any) => a.keyword.localeCompare(b.keyword))
  }

  // generate children tree node components
  let childNodes = children.map((ch: Module | CommonNode, i: React.Key) => (
    <TreeNode {...{nodeData: ch}} key={i} {...{goToFn: goToFn}}></TreeNode>
  ))

  return (
    <div className={styles["tree-viewer"]} {...{css: css}}>
      <NavBar {...{currentNodeData: _currentNode}} {...{goToFn: goToFn}}></NavBar>
      <div className={styles["tree-nodes"]}>{childNodes}</div>
    </div>
  )
}
