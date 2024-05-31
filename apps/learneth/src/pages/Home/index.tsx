import React, {useContext, useEffect} from 'react'
import {Link} from 'react-router-dom'
import Markdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import remarkGfm from 'remark-gfm'
import {AppContext} from '../../contexts'
import RepoImporter from '../../components/RepoImporter'
import {initWorkshop} from '../../actions'
import './index.css'
import { hyphenateString } from '../../utils'


function HomePage(): JSX.Element {
  const [openKeys, setOpenKeys] = React.useState<string[]>([])

  const isOpen = (key: string) => openKeys.includes(key)
  const handleClick = (key: string) => {
    setOpenKeys(isOpen(key) ? openKeys.filter((item) => item !== key) : [...openKeys, key])
  }

  const {appState, localeCode} = useContext(AppContext)
  const {list, detail, selectedId} = appState.workshop

  const selectedRepo = detail[selectedId]

  const levelMap: any = {
    1: 'Beginner',
    2: 'Intermediate',
    3: 'Advanced',
  }

  useEffect(() => {
    initWorkshop(localeCode)
  }, [])

  return (
    <div className="App">
      <RepoImporter list={list} selectedRepo={selectedRepo || {}} />
      {selectedRepo && (
        <div className="container-fluid">
          {Object.keys(selectedRepo.group).map((level) => (
            <div key={level}>
              <div className="mb-2 border-bottom small">{levelMap[level]}:</div>
              {selectedRepo.group[level].map((item: any) => (
                <div key={item.id}>
                  <div>
                    <span
                      className="arrow-icon d-inline-block"
                      onClick={() => {
                        handleClick(item.id)
                      }}
                    >
                      <i className={`fas fa-xs ${isOpen(item.id) ? 'fa-chevron-down' : 'fa-chevron-right'}`} />
                    </span>
                    <span
                      className="workshop-link"
                      data-id={`workshop-link-${hyphenateString(selectedRepo.entities[item.id].name)}`}
                      onClick={() => {
                        handleClick(item.id)
                      }}
                    >
                      {selectedRepo.entities[item.id].name}
                    </span>
                    <Link data-id={`workshop-link-play-${hyphenateString(selectedRepo.entities[item.id].name)}`} to={`/list?id=${item.id}`} className="text-decoration-none float-right">
                      <i className="fas fa-play-circle fa-lg" />
                    </Link>
                  </div>
                  <div className={`container-fluid bg-light ${isOpen(item.id) ? 'pt-3 mt-2' : 'description-collapsed overflow-hidden text-break p-0 m-0'}`}>
                    {levelMap[level] && <p className="d-inline pt-2 pr-1 font-weight-bold small text-uppercase">{levelMap[level]}</p>}

                    {selectedRepo.entities[item.id].metadata.data.tags?.map((tag: string) => (
                      <p key={tag} className="d-inline pr-1 font-weight-bold small text-uppercase">
                        {tag}
                      </p>
                    ))}

                    {selectedRepo.entities[item.id].steps && <div className="d-none">{selectedRepo.entities[item.id].steps.length} step(s)</div>}

                    <div className="workshop-list_description pb-3 pt-3">
                      <Markdown rehypePlugins={[rehypeRaw]} remarkPlugins={[remarkGfm]}>
                        {selectedRepo.entities[item.id].description?.content}
                      </Markdown>
                    </div>

                    <div className="actions"></div>
                  </div>
                  <div className="mb-3"></div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default HomePage
