/**
 * Copyright (c) 2024 Jakub Holcman.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 */
import {useState, useEffect, useRef, useMemo} from "react"
import styles from "./styles.module.css"
import "./styles.module.css"

function NavBar({currentNodeData, goToFn}) {
  const _nodeData = currentNodeData
  const elementRef = useRef(null)

  // scroll to last
  useEffect(() => {
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
        active={index === len ? "true" : "false"}
        {...(index === len ? {ref: elementRef} : {})}
      >
        <span className={styles["path-element-text"]}>{ctx.name}</span>
      </div>,
    )
    index += 1
  }

  return <nav className={styles["nav-bar"]}>{elements}</nav>
}

function TreeNode({nodeData, goToFn}) {
  const _nodeData = nodeData
  const [folded, setFolded] = useState(true)
  const elementRef = useRef(null)

  const typeToIcon = {
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
      elementRef.current.parentNode.scrollTop = elementRef.current.offsetTop - 300
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
            scroll()
            setFolded(!folded)
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

function initTree(node) {
  // Add parent reference for all children nodes
  let children = node.children
  if (node["tree-root"] === true) {
    children = node.modules
  }
  for (let child of children) {
    child.parent = node
    initTree(child)
  }
  return node
}

export default function YangTreeViewer({tree, "sm-sort": smSort}) {
  const _smSort = smSort === "true"
  const _cachedTree = useMemo(() => initTree(tree), [])
  const [_currentNode, setCurrentNode] = useState(_cachedTree)

  function goToFn(node) {
    // sets current node state
    if (getChildren(node).length !== 0) setCurrentNode(node)
  }

  function getChildren(node) {
    let children = node.children
    if (node["tree-root"] === true) {
      children = node.modules
    }
    return children
  }

  let children = getChildren(_currentNode)

  if (_currentNode["tree-root"] === true && _smSort === true) {
    children.sort((a, b) => a.keyword.localeCompare(b.keyword))
  }

  // generate children tree node components
  let childNodes = children.map((ch, i) => (
    <TreeNode nodeData={ch} key={i} goToFn={goToFn}></TreeNode>
  ))

  return (
    <div className={styles["tree-viewer"]}>
      <NavBar currentNodeData={_currentNode} goToFn={goToFn}></NavBar>
      <div className={styles["tree-nodes"]}>{childNodes}</div>
    </div>
  )
}
