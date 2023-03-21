import fetch from "node-fetch";
import fs from "fs";
import IpfsHttpClient from 'ipfs-http-client'
import * as util from 'util'
import * as child_process from 'child_process'

(async () => {
  const pluginsDirectory = 'https://raw.githubusercontent.com/ethereum/remix-plugins-directory/master/build/metadata.json'
  const metadata = await fetch(pluginsDirectory, { method: 'GET' })
  
  // get command line arguments
  const args = process.argv.slice(2)
  const pluginName = args[0]
  const sha = args[1]
  const build = args[2]
  let sha_field = 'sha_' + build
  let url_field = 'url_' + build

  if(build === 'live') {
    sha_field = 'sha'
    url_field = 'url'
  }

  console.log(process.argv)

  if (!pluginName || !sha || !build) {
    console.error('missing arguments')
    process.exit(1)
  }

  // search for the plugin in the metadata
  const plugins = await metadata.json()
  const plugin = plugins.find((p: any) => p.name === pluginName)
  let profileJSON: any = null
  try{
    profileJSON = JSON.parse(fs.readFileSync(`apps/${pluginName}/profile.json`, 'utf8'))
  }catch(e){
    console.log('local profile.json not found')
  }
   
  if (!plugin) {
    console.error('plugin not found in the directory, attempting to create it...')
    if(!profileJSON){
      console.error('create a profile.json file in the plugin folder')
      process.exit(1)
    }
  }

  // check if build and sha exist
  if (plugin[url_field] && plugin[sha_field]) {
    // compare the sha
    if (plugin[sha_field] === sha) {
      console.log('plugin already published')
      process.exit(0)
    }
  }

  // update the plugin

  plugin[sha_field] = sha

  // publish the plugin
  const host = 'ipfs.infura.io'
  const projectId = process.env.infura_project_id
  const projectSecret = process.env.infura_project_secret
  const auth = 'Basic ' + Buffer.from(projectId + ':' + projectSecret).toString('base64')

  const ipfs = IpfsHttpClient({ port: 5001, host, protocol: 'https', headers: {
    authorization: auth
  } })
  const { globSource } = IpfsHttpClient
  const folder = `dist/apps/${pluginName}`

  const result = await ipfs.add(globSource(folder, { recursive: true}), { pin: true })
  const hash = result.cid.toString()
  const url = `https://ipfs-cluster.ethdevops.io/ipfs/${hash}`
  plugin[url_field] = url
  console.log('ipfs hash', hash, 'url', url)
  console.log('publishing plugin', plugin, 'with sha', sha, 'and build', build)

  // write the profile.json file
  const plugin_directory_path = 'remix-plugins-directory/plugins/'
  
  // create the plugin directory if it doesn't exist
  const exists = fs.statSync(plugin_directory_path + pluginName).isDirectory()
  if(!exists){
    console.log('creating plugin directory')
    fs.mkdirSync(plugin_directory_path + pluginName)
  }
  // write the profile.json file
  fs.writeFileSync(plugin_directory_path + pluginName + '/profile.json', JSON.stringify(plugin, null, 2))

  // read the profile.json file
  const content = fs.readFileSync(plugin_directory_path + pluginName + '/profile.json')
  console.log('profile.json', content.toString())

  /*
  // create pull request
  const promisifyExec = util.promisify(child_process.exec)
  let out = await promisifyExec('git status', {
    cwd: process.cwd() + '/remix-plugins-directory'
  })
  console.log(out)
  
  out = await promisifyExec(`git checkout -b ${pluginName}${sha}`, {
    cwd: process.cwd() + '/remix-plugins-directory'
  })
  out = await promisifyExec('git add .', {
    cwd: process.cwd() + '/remix-plugins-directory'
  })
  out = await promisifyExec(`git commit -m "update profile ${pluginName} with url ${url}"`, {
    cwd: process.cwd() + '/remix-plugins-directory'
  })

  console.log(out)
  */
})()