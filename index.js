/*
Light orb substitute: 1. 756_412, enrgy orb, shape: 905670
					  2. 466_46622, dw orb, shape: 611410		 
					  
Dark orb substitute : 1. 756_408, dark orb, shape:650010
//Hard
3002 - white bead (1201144941 skillid for appear effect/1201144944 for disappear effect)
3003 - black bead (1201144942 skillid for appear effect/1201144945 for disappear effect)
//Normal
3002 - white bead (1188037741 skillid for appear effect/1188037744 for disappear effect)
3003 - black bead (1188037742 skillid for appear effect/1188037745 for disappear effect)

Might be buggy
*/

const Command = require('command'),
	config = require('./config')
	
const zone = [9720,9920],
	skillIdAlive = [1133,1134],
	skillIdDie = [1137,1136],
	huntingZones = [720,920]


module.exports = function aaorb(dispatch) {
	const command = Command(dispatch)
	
	let {enabled,switchColors,instantDespawn,lightShapeId,darkShapeId} = config,
		inDungeon = false,
		hooks = []
	
	lightShapeId = parseInt(lightShapeId)
	darkShapeId = parseInt(darkShapeId)


////Commands	
	command.add('aaorb', (sub,substr) => {
		if(sub === undefined) {
			enabled = !enabled
			command.message(`(AA ORB) ${enabled ? 'enabled' : 'disabled'}`) 
		}
		else
			switch(sub) {
				case 'switch':
				case 'switchcolor':
				case 'switchcolour':
				case 'color':
				case 'colour':
				case 'change':
					switchColors = !switchColors
					command.message(`(AA ORB) Switch colors: ${switchColors}`) 
					break
				case 'hook':
					load()
					command.message(`(AA ORB) Hooked`) 
					break
				case 'unhook':
				case 'unload':
					unload()
					command.message(`(AA ORB) Unhooked`) 
					break
				case 'light':
					lightShapeId = parseInt(substr)
					break
				case 'dark':
					darkShapeId = parseInt(substr)
					break
				default:
					command.message('(AA ORB) Unknown Command')
			}
	})
	
/////Hooks	
	dispatch.hook('S_LOAD_TOPO', 3, event => {
		inDungeon = zone.includes(event.zone)
		
		if(inDungeon && enabled) load();
		else if(!inDungeon && hooks.length !== 0) unload();
	})		


	
	
	function load() { //Reduce overhead when not in AA
		hook('S_SPAWN_NPC', 9, event => {
			if(enabled && (event.huntingZoneId === 720 || event.huntingZoneId === 920)) {
				if(event.templateId === 3002) {//White bead
					event.unk1 = switchColors ? darkShapeId : lightShapeId
					return true
				}
				else if(event.templateId === 3003) { //Dark Bead
					event.unk1 = switchColors ? lightShapeId : darkShapeId
					return true
				}
			}
		})
		
		hook('S_ACTION_STAGE', dispatch.base.majorPatchVersion >= 74 ? 7 : 6, event => {
			if(enabled && (event.templateId === 3002 || event.templateId === 3003)) {
				if(!huntingZones.includes(event.skill.huntingZoneId)) return;
				
				if(skillIdAlive.includes(event.skill.id)) return false;
				
				else if(instantDespawn && skillIdDie.includes(event.skill.id)) {
					dispatch.toClient('S_DESPAWN_NPC', 1, {
						target: event.gameId,
						type: 1	
					})
				}
			}
		})
		
	}
				
/////Function			
	function unload() { //thank pinkie
		if(hooks.length) {
			for(let h of hooks) dispatch.unhook(h)

			hooks = []
		}
	}

	function hook() {
		hooks.push(dispatch.hook(...arguments))
	}

}