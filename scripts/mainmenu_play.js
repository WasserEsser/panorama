'use strict';

var PlayMenu = ( function()
{
	                                                                   
	var m_mapSelectionButtonContainers = {};
	                                        
	var m_gameModeConfigs = {};
	                                                    
	var m_arrGameModeRadios = [];
	                                                
	var GetMGDetails;
	var GetGameType;

	var m_activeMapGroupSelectionPanelID = null;
	var m_allowNearbyUsersToJoinSetting = null;
	var m_serverSetting = '';
	var m_steamGroupIdThatCanJoin = '';
	var m_permissions = '';

	var _Init = function()
	{
		                                                
		var cfg = GameTypesAPI.GetConfig();
		                                                                                                  
		                                                   
		for ( var type in cfg.gameTypes )
		{
			for ( var mode in cfg.gameTypes[ type ].gameModes )
			{
				m_gameModeConfigs[ mode ] = cfg.gameTypes[ type ].gameModes[ mode ];
			}
		}

		                                                                                  
		                                                                                                                                 
		GetGameType = function( mode )
		{
			for ( var gameType in cfg.gameTypes ) 
			{
				if ( cfg.gameTypes[ gameType ].gameModes.hasOwnProperty( mode ) )
					return gameType;
			}
		};

		GetMGDetails = function( mg )
		{
			return cfg.mapgroups[ mg ];
		};

		                                                                                                  
		                                                                
		                                                
		var elGameModeSelectionRadios = $( '#GameModeSelectionRadios' );
		m_arrGameModeRadios = elGameModeSelectionRadios.Children();
		m_arrGameModeRadios.forEach( function( entry )
		{
			entry.SetPanelEvent( 'onactivate', function()
			{
				_UpdateMapGroupButtons( false );
				_ApplySessionSettings();
			} );
		} );

		                              
		var elPrimeStatusButton = $( '#PrimeStatusButton' );
		elPrimeStatusButton.SetPanelEvent( 'onactivate', function()
		{
			UiToolkitAPI.HideTextTooltip();
			UiToolkitAPI.ShowCustomLayoutPopup( 'prime_status', 'file://{resources}/layout/popups/popup_prime_status.xml' );
		} );

		                      
		var elPrimeButton = $( '#PrimeButton' );
		elPrimeButton.SetPanelEvent( 'onactivate', function()
		{
			UiToolkitAPI.HideTextTooltip();
			_ApplySessionSettings();
		} );

		                         
		var elPermissionsButton = $( '#PermissionsSettings' );
		elPermissionsButton.SetPanelEvent( 'onactivate', function()
		{
			UiToolkitAPI.ShowCustomLayoutPopup( 'permission_settings', 'file://{resources}/layout/popups/popup_permissions_settings.xml' );
		} );

		                           
		var btnStartSearch = $( '#StartMatchBtn' );
		btnStartSearch.SetPanelEvent( 'onactivate', function()
		{
			$.DispatchEvent( 'PlaySoundEffect', 'mainmenu_press_GO', 'MOUSE' );
			btnStartSearch.AddClass( 'pressed' );
			LobbyAPI.StartMatchmaking();
		} );

		var btnCancel = $.GetContextPanel().FindChildInLayoutFile( 'PartyCancelBtn' );
		btnCancel.SetPanelEvent( 'onactivate', function()
		{
			LobbyAPI.StopMatchmaking();
			$.DispatchEvent( 'PlaySoundEffect', 'UIPanorama.generic_button_press', 'MOUSE' );
		});

		elPermissionsButton.SetPanelEvent( 'onmouseover', function()
		{

			var displayString = $.Localize( '#tooltip_permissions_title' );

			if ( m_permissions !== 'private' )
			{
				if ( m_steamGroupIdThatCanJoin )
				{
					var clan = PartyListAPI.GetPartyClanTag();
					elPermissionsButton.SetDialogVariable( "group", clan );
					displayString = displayString + '<br><br>' + $.Localize( 'tooltip_permissions_group', elPermissionsButton );
				}

				if ( m_allowNearbyUsersToJoinSetting === 1 )
				{
					displayString = displayString + '<br>' + $.Localize( 'tooltip_permissions_nearby' );
				}
			}

			UiToolkitAPI.ShowTextTooltip( 'PermissionsSettings', displayString );
		} );

		elPermissionsButton.SetPanelEvent( 'onmouseout', function()
		{
			UiToolkitAPI.HideTextTooltip();
		} );

		                                            
		_SyncDialogsFromSessionSettings( LobbyAPI.GetSessionSettings() );
		_ApplySessionSettings();

	};

	var _IsGameModeAvailable = function( serverType, gameMode )
	{
		       
		                                           
			                           
			 
		 
			             
		 
		       

		return true;
	}

	var _SyncDialogsFromSessionSettings = function( settings )
	{
		m_allowNearbyUsersToJoinSetting = settings.game.nby;
		m_serverSetting = settings.options.server;
		m_steamGroupIdThatCanJoin = settings.game.clanid;
		m_permissions = settings.system.access;
		var isHost = LobbyAPI.BIsHost();
		var searchingStatus = LobbyAPI.GetMatchmakingStatusString();
		var isSearching = searchingStatus !== '' && searchingStatus !== undefined ? true : false;
		var isEnabled = !isSearching && isHost ? true : false;

		                                           
		for ( var i = 0; i < m_arrGameModeRadios.length; ++i ) 
		{
			var strGameMode = m_arrGameModeRadios[ i ].id;
			var bGameModeAvailable = _IsGameModeAvailable( m_serverSetting, strGameMode );

			if ( strGameMode === settings.game.mode )
			{
				m_arrGameModeRadios[ i ].checked = true;
			}
			
			                                                       
			m_arrGameModeRadios[ i ].enabled = isEnabled && bGameModeAvailable;
		}

		                                                                   
		_UpdateMapGroupButtons( isEnabled );
		_SelectMapButtonsFromSettings( settings );

		_ShowHideStartSearchBtn( isEnabled );
		_ShowCancelSearchButton( isSearching, isHost );

		                   
		_UpdatePrimeBtn( settings.game.prime === 1 ? true : false, isEnabled );
		_UpdatePermissionBtnText( settings, isEnabled );

		                                  
		_UpdatePlayDropDown( settings.options.server );

		$( '#PlayTopNavDropdown' ).enabled = isEnabled;
		_SetClientViewLobbySettingsTitle( isHost );
	};

	var _SetClientViewLobbySettingsTitle = function( isHost )
	{
		var elTitle = $.GetContextPanel().FindChildInLayoutFile( 'LobbyLeaderText' );
		
		if ( isHost )
		{
			elTitle.text = $.Localize( '#SFUI_MainMenu_PlayButton' );
			return;
		}

		var xuid = PartyListAPI.GetPartySystemSetting( "xuidHost" );
		var leaderName = FriendsListAPI.GetFriendName( xuid );
		

		elTitle.SetDialogVariable( 'name', leaderName );
		elTitle.text = $.Localize( '#play_lobbyleader_title', elTitle );
	};

	var _GetCurrentGameModeSelection = function()
	{
		var sel = m_arrGameModeRadios[ 0 ].GetSelectedButton();
		return sel.id;
	};

	var _GetAvailableMapGroups = function( gameMode, isPlayingOnValveOfficial )
	{
		if ( isPlayingOnValveOfficial )
		{
			return Object.keys( m_gameModeConfigs[ gameMode ].mapgroupsMP );
		}
		else
		{
			return Object.keys( m_gameModeConfigs[ gameMode ].mapgroupsSP );
		}
	};

	var _GetCurrentServerType = function()
	{
		var elDropDownEntry = $( '#PlayTopNavDropdown' ).GetSelected();
		return elDropDownEntry.GetAttributeString( 'data-type', '(not_found)' );
	};

	var _GetMapGroupPanelID = function( gameMode, isPlayingOnValveOfficial )
	{
		var panelID = 'gameModeButtonContainer_' + gameMode + '_' + ( isPlayingOnValveOfficial ? "online" : "offline" );
		return panelID;
	}

	var _OnActivateMapOrMapGroupButton = function( mapgroupButton )
	{
		$.DispatchEvent( 'PlaySoundEffect', 'submenu_leveloptions_select', 'MOUSE' );
		if ( _CheckContainerHasAnyChildChecked( mapgroupButton.GetParent() ) )
		{
			_ApplySessionSettings();
		}
	}

	var _UpdateMapGroupButtonsForGameMode = function ( gameMode, isEnabled )
	{
		var isPlayingOnValveOfficial = _IsPlayingOnValveOfficial();
		var panelID = _GetMapGroupPanelID( gameMode, isPlayingOnValveOfficial );

		if ( !( panelID in m_mapSelectionButtonContainers ) )
		{
			var container = $.CreatePanel( "Panel", $( '#MapSelectionList' ), panelID, {
				class: 'map-selection-list Hidden'
			} );

			m_mapSelectionButtonContainers[ panelID ] = container;
			m_activeMapGroupSelectionPanelID = panelID;

			                             
			var OnMouseOver = function( id, tooltipText, mapsList )
			{
				tooltipText = $.Localize( tooltipText );

				var mapNamesList = [];

				if ( mapsList.length > 1 )
				{
					mapsList.forEach( function( element )
					{
						mapNamesList.push( $.Localize( 'SFUI_Map_' + element ) );
					} );

					var mapGroupsText = mapNamesList.join( ', ' );
					tooltipText = tooltipText + '<br><br>' + mapGroupsText;
				}

				UiToolkitAPI.ShowTextTooltip( id, tooltipText );
			};

			var OnMouseOut = function()
			{
				UiToolkitAPI.HideTextTooltip();
			};

			var arrMapGroups = _GetAvailableMapGroups( gameMode, isPlayingOnValveOfficial );
			var bIsCompetitive = gameMode === 'competitive';
			var bIsSkirmish = gameMode === 'skirmish';
			var bIsWingman = gameMode === 'scrimcomp2v2';
			var panelType = ( ( ( bIsCompetitive || bIsSkirmish || bIsWingman ) && isPlayingOnValveOfficial ) ? "ToggleButton" : "RadioButton" );
			for ( var k in arrMapGroups )
			{
				var mapName = arrMapGroups[ k ];
				var mg = GetMGDetails( mapName );
				var p = $.CreatePanel( panelType, container, panelID + mapName );
				p.BLoadLayoutSnippet( "MapGroupSelection" );
				if ( panelType === "RadioButton" )
					p.group = "radiogroup_" + panelID;
				
				p.SetAttributeString( "mapname", mapName );
				p.SetPanelEvent( 'onactivate', _OnActivateMapOrMapGroupButton.bind( this, p ) );

				p.FindChildInLayoutFile( 'ActiveGroupIcon' ).visible = mg.grouptype === 'active';
				p.FindChildInLayoutFile( 'MapGroupName' ).text = $.Localize( mg.nameID );

				var keysList = Object.keys( mg.maps );
				var mapIcon = null;
				var mapImage = null;
				                                          
				if ( keysList.length > 1 )
				{
					p.AddClass( 'map-selection-btn--large' );
					p.FindChildInLayoutFile( 'MapSelectionButton' ).AddClass( 'map-selection-btn-container--large' );
					p.FindChildInLayoutFile( 'MapGroupName' ).AddClass( 'fontSize-m' );
					p.FindChildInLayoutFile( 'MapGroupCollectionIcon' ).visible = false;
				}
				else
				{
					mapIcon = p.FindChildInLayoutFile( 'MapGroupCollectionIcon' );
					mapIcon.visible = true;

					IconUtil.SetupFallbackMapIcon( mapIcon, 'file://{images}/' + mg.icon_image_path );

					var mapGroupIcon = mapName === 'random' ? 'file://{images}/icons/ui/random.svg' : 'file://{images}/' + mg.icon_image_path + '.svg';
					mapIcon.SetImage( mapGroupIcon );
				}

				if ( mapName === 'random' )
				{
					mapImage = $.CreatePanel( 'Panel', p.FindChildInLayoutFile( 'MapGroupImagesCarousel' ), 'MapSelectionScreenshot' );
					mapImage.AddClass( 'map-selection-btn__screenshot' );

					mapImage.style.backgroundImage = 'url("file://{images}/map_icons/screenshots/360p/random.png")';
					mapImage.style.backgroundPosition = '50% 0%';
					mapImage.style.backgroundSize = 'auto 100%';
				}

				                              
				for ( var i = 0; i < keysList.length; i++ )
				{
					mapImage = $.CreatePanel( 'Panel', p.FindChildInLayoutFile( 'MapGroupImagesCarousel' ), 'MapSelectionScreenshot' + i );
					mapImage.AddClass( 'map-selection-btn__screenshot' );
					mapImage.style.backgroundImage = 'url("file://{images}/map_icons/screenshots/360p/' + keysList[ i ] + '.png")';
					mapImage.style.backgroundPosition = '50% 0%';
					mapImage.style.backgroundSize = 'auto 100%';

					                               
					if ( keysList.length > 1 )
					{
						                                  
						
						mapIcon = $.CreatePanel( 'Image', p.FindChildInLayoutFile( 'MapGroupCollectionMultiIcons' ), 'MapIcon' + i, {
							defaultsrc: 'file://{images}/map_icons/map_icon_NONE.png',
							texturewidth: '72',
							textureheight: '72',
							src: 'file://{images}/map_icons/map_icon_' + keysList[ i ] + '.svg'
						} );
						mapIcon.AddClass( 'map-selection-btn__map-icon' );
						mapIcon.AddClass( 'map-selection-btn__map-icon-small' );

						IconUtil.SetupFallbackMapIcon( mapIcon, 'file://{images}/map_icons/map_icon_' + keysList[ i ] );
					}
				}

				          
				if ( mg.tooltipID )
				{
					p.SetPanelEvent( 'onmouseover', OnMouseOver.bind( undefined, p.id, mg.tooltipID, keysList ) );
					p.SetPanelEvent( 'onmouseout', OnMouseOut );
				}
			}

			                                                                          
			container.OnPropertyTransitionEndEvent = function( panelName, propertyName )
			{
				if ( container.id === panelName && propertyName === 'opacity' )
				{
					                                         
					if ( container.visible === true && container.BIsTransparent() )
					{
						container.visible = false;
						return true;
					}
				}
				return false;
			};

			$.RegisterEventHandler( 'PropertyTransitionEnd', container, container.OnPropertyTransitionEndEvent );
		}

		for ( var key in m_mapSelectionButtonContainers )
		{
			if ( key !== panelID )
			{
				m_mapSelectionButtonContainers[ key ].AddClass( "Hidden" );
			}
			else
			{
				                               
				m_mapSelectionButtonContainers[ key ].RemoveClass( "Hidden" );
				m_mapSelectionButtonContainers[ key ].visible = true;
				m_activeMapGroupSelectionPanelID = key;

				                                         
				m_mapSelectionButtonContainers[ key ].enabled = isEnabled;

				if ( ( gameMode === 'competitive' || gameMode === 'scrimcomp2v2' ) && isPlayingOnValveOfficial )
				{
					_UpdateWaitTime( m_mapSelectionButtonContainers[ key ] );
				}
			}
		}
	}	

	var _UpdateMapGroupButtons = function( isEnabled )
	{
		_UpdateMapGroupButtonsForGameMode( _GetCurrentGameModeSelection(), isEnabled );
	};

	var _SelectMapButtonsFromSettings = function( settings )
	{
		                                                                 
		var mapsGroups = settings.game.mapgroupname.split( ',' );

		m_mapSelectionButtonContainers[ m_activeMapGroupSelectionPanelID ].Children().forEach( function( e )
		{
			                                                                      
			var mapName = e.GetAttributeString( "mapname", "invalid" );
			e.checked = mapsGroups.includes( mapName );
		} );
	};

	var _ShowHideStartSearchBtn = function( bShow )
	{
		var btnStartSearch = $.GetContextPanel().FindChildInLayoutFile( 'StartMatchBtn' );

		                                                                    
		                                                                                        
		                                                 
		if ( bShow )
		{
			if ( btnStartSearch.BHasClass( 'pressed' ) )
			{
				btnStartSearch.RemoveClass( 'pressed' );
			}

			btnStartSearch.RemoveClass( 'hidden' );
		}
		                                                                                                     
		                                            
		else if ( !btnStartSearch.BHasClass( 'pressed' ) )
		{
			btnStartSearch.AddClass( 'hidden' );
		}
	};

	var _ShowCancelSearchButton = function( isSearching, isHost )
	{
		var btnCancel= $.GetContextPanel().FindChildInLayoutFile( 'PartyCancelBtn' );
		                                                                 
		btnCancel.enabled = ( isSearching && isHost );
	};

	var _UpdatePrimeBtn = function( isPrime, isEnabled )
	{
		var AreLobbyPlayersPrime = function()
		{
			var playersCount = PartyListAPI.GetCount();

			for ( var i = 0; i < playersCount; i++ )
			{
				var xuid = PartyListAPI.GetXuidByIndex( i );
				var isFriendPrime = PartyListAPI.GetFriendPrimeEligible( xuid );

				if ( isFriendPrime === false )
				{
					return false;
				}
			}

			return true;
		};

		var elPrimeStatusButton = $( '#PrimeStatusButton' );
		elPrimeStatusButton.visible = false;
		var elPrimeButton = $( '#PrimeButton' );
		elPrimeButton.visible = false;
		var tooltipText = '';

		var elActiveButton = null;

		                                                
		                                                                               
		if ( AreLobbyPlayersPrime() && _IsPlayingOnValveOfficial() )
		{
			var strGameMode = _GetCurrentGameModeSelection();

			elPrimeButton.visible = true;
			elPrimeButton.enabled = isEnabled && ( strGameMode === 'competitive' || strGameMode === 'scrimcomp2v2' );
			elPrimeButton.checked = isPrime;
			tooltipText = isPrime ? '#tooltip_prime_only' : '#tooltip_prime_priority';

			elActiveButton = elPrimeButton;
		}
		else if ( !PartyListAPI.GetFriendPrimeEligible( MyPersonaAPI.GetXuid() ) )
		{
			var bPrimeUpgradeAvailable = MyPersonaAPI.HasPrestige() || FriendsListAPI.GetFriendLevel( MyPersonaAPI.GetXuid() ) > 20;
			if ( bPrimeUpgradeAvailable )
			{
				tooltipText = "#tooltip_prime_upgrade_available";
			}
			else
			{
				var isPerfectWorld = MyPersonaAPI.GetLauncherType() == "perfectworld" ? true : false;
				tooltipText = isPerfectWorld ? '#tooltip_prime_not_enrolled_pw' : '#tooltip_prime_not_enrolled';
			}

			elPrimeStatusButton.visible = true;
			elPrimeStatusButton.enabled = bPrimeUpgradeAvailable;
			elActiveButton = elPrimeStatusButton;
		}
		else
		{
			elPrimeButton.enabled = false;

			                                                
			if ( !_IsPlayingOnValveOfficial() )
			{
				tooltipText = '#tooltip_prime-playing-offline';
			}
			else
			{
				tooltipText = '#tooltip_prime-lobby_has_nonprime_player';
			}

			elPrimeButton.visible = true;
			elActiveButton = elPrimeButton;
		}

		elActiveButton.SetPanelEvent( 'onmouseover', function() { UiToolkitAPI.ShowTextTooltip( elActiveButton.id, tooltipText ); } );
		elActiveButton.SetPanelEvent( 'onmouseout', function() { UiToolkitAPI.HideTextTooltip(); } );
	};

	var _UpdatePermissionBtnText = function( settings, isEnabled )
	{
		var elBtn = $( '#PermissionsSettings' );
		var displayText = '';

		var elLockImg = $.GetContextPanel().FindChildInLayoutFile( 'PermissionsSettingsImg' );
		if ( settings.system.access === 'public' )
		{
			if ( settings.game.hasOwnProperty( 'clanid' ) && settings.game.clanid !== '' )
				displayText = '#permissions_group';
			else
				displayText = '#permissions_' + settings.system.access;
			
			displayText = settings.game.nby === 1 ? displayText + '_nearby' : displayText;

			elLockImg.SetImage( "file://{images}/icons/ui/unlockedwide.svg" );
		}
		else
		{
			displayText = '#permissions_' + settings.system.access;
			elLockImg.SetImage( "file://{images}/icons/ui/locked.svg" );
		}

		elBtn.FindChild( 'PermissionsSettingsLabel' ).text = $.Localize( displayText ).toUpperCase();

		                                           
		elBtn.enabled = isEnabled;
	};

	var _UpdateWaitTime = function( elMapList )
	{
		var childrenList = elMapList.Children();

		for ( var i = 0; i < childrenList.length; i++ )
		{
			var elWaitTime = childrenList[ i ].FindChildTraverse( 'MapGroupWaitTime' );
			var mapName = childrenList[ i ].GetAttributeString( "mapname", "invalid" );
			var seconds = LobbyAPI.GetMapWaitTimeInSeconds( _GetCurrentGameModeSelection(), mapName );
			var numWait = FormatText.SecondsToDDHHMMSSWithSymbolSeperator( seconds );

			if ( numWait )
			{
				elWaitTime.SetDialogVariable( "time", numWait );
				elWaitTime.FindChild( 'MapGroupWaitTimeLabel' ).text = $.Localize( '#matchmaking_expected_wait_time', elWaitTime );
				elWaitTime.RemoveClass( 'Hidden' );
			}
			else
			{
				elWaitTime.AddClass( 'Hidden' );
			}
		}
	};

	var _UpdatePlayDropDown = function( serverType )
	{
		$( '#PlayTopNavDropdown' ).SetSelected( 'Play-' + serverType );
	};

	var _IsValveOfficialServer = function( serverType )
	{
		return serverType === "official" ? true : false
	}

	var _IsPlayingOnValveOfficial = function()
	{
		return _IsValveOfficialServer( m_serverSetting );
	};

	var _IsPrimeChecked = function()
	{
		return $( '#PrimeButton' ).checked;
	};

	var _GetSelectedMapsForServerTypeAndGameMode = function ( serverType, gameMode )
	{
		var isPlayingOnValveOfficial = _IsValveOfficialServer( serverType );
		var mapGroupPanelID = _GetMapGroupPanelID( gameMode, isPlayingOnValveOfficial );

		var mapContainer = m_mapSelectionButtonContainers[ mapGroupPanelID ];

		                                                                                                             
		if ( !_CheckContainerHasAnyChildChecked( mapContainer ) )
		{
			var preferencesMapsForThisMode = InventoryAPI.GetUIPreferenceString( 'ui_playsettings_maps_' + serverType + '_' + gameMode );
			var savedMapIds = preferencesMapsForThisMode.split( ',' );
			savedMapIds.forEach( function( strMapNameIndividual )
			{
				var mapsWithThisName = mapContainer.Children().filter( function( map )
				{
					var mapName = map.GetAttributeString( "mapname", "invalid" );
					return mapName === strMapNameIndividual;
				} );
				if ( mapsWithThisName.length > 0 )
				{
					mapsWithThisName[0].checked = true;
				}
			} );
			if ( !_CheckContainerHasAnyChildChecked( mapContainer ) )
			{
				mapContainer.Children()[0].checked = true;
			}
		}

		var selectedMaps = mapContainer.Children().filter( function( e )
		{
			                                                         
			return e.checked;
		} ).reduce( function( accumulator, e )
		{
			                                              
			var mapName = e.GetAttributeString( "mapname", "invalid" );
			return ( accumulator ) ? ( accumulator + "," + mapName ) : mapName;
		}, '' );

		return selectedMaps;
	}

	                                                                                                    
	                                                    
	                                                                                                    
	var _CheckContainerHasAnyChildChecked = function( aPanelContainer )
	{
		return aPanelContainer.Children().filter( function( map )
			{
				return map.checked;
			} )
			.length > 0;
	}

	                                                                                                    
	                                   
	                                                                                                    
	var _GetSelectedMapsForCurrentServerTypeAndGameMode = function()
	{
		return _GetSelectedMapsForServerTypeAndGameMode( _GetCurrentServerType(), _GetCurrentGameModeSelection() );
	};

	                                                                                                    
	                                   
	                                                                                                    
	var _ApplySessionSettings = function()
	{
		if ( !LobbyAPI.BIsHost() )
		{
			return;
		}

		var serverType = _GetCurrentServerType();
		var selectedMaps = _GetSelectedMapsForCurrentServerTypeAndGameMode();

		var settings = {
			update: {
				Options: {
					action: "custommatch",
					server: serverType
				},
				Game: {
					prime: _IsPrimeChecked(),
					mode: _GetCurrentGameModeSelection(),
					type: GetGameType( _GetCurrentGameModeSelection() ),
					mapgroupname: selectedMaps
				},
			}
		};

		InventoryAPI.SetUIPreferenceString( 'ui_playsettings_mode_' + serverType, _GetCurrentGameModeSelection() );
		InventoryAPI.SetUIPreferenceString( 'ui_playsettings_maps_' + serverType + '_' + _GetCurrentGameModeSelection(), selectedMaps );

		_UpdateSessionSettings( settings );
	};

	var _ApplySessionServerSetting = function()
	{
		if ( !LobbyAPI.BIsHost() )
			return;
			
		var serverType = _GetCurrentServerType();
		var settings = {
			update: {
				Options: {
					action: "custommatch",
					server: serverType
				},
				Game: {}
			}
		};
		
		                                             
		var gameMode = _GetCurrentGameModeSelection();
		if ( !_IsGameModeAvailable( serverType, gameMode ) )
		{
			                                                  
			gameMode = "casual";
			settings.update.Game.mode = gameMode;
			settings.update.Game.type = GetGameType( gameMode );

			_UpdateMapGroupButtonsForGameMode( gameMode, false );
		}
		settings.update.Game.mapgroupname = _GetSelectedMapsForServerTypeAndGameMode( serverType, gameMode );

		_UpdateSessionSettings( settings );
	};

	var _UpdateSessionSettings = function( settings )
	{
		LobbyAPI.UpdateSessionSettings( settings );
	};

	                                                                                                    
	                                
	                                                                                                    
	var _SessionSettingsUpdate = function( sessionState ) 
	{
		                                                                
		if ( sessionState === "ready" )
		{
			_Init();                                                                  
		}
		                                                      
		else if ( sessionState === "updated" )
		{
			var settings = LobbyAPI.GetSessionSettings();

			_SyncDialogsFromSessionSettings( settings );
		}
		else if ( sessionState === "closed" )
		{
			                                         
			          
			$.DispatchEvent( 'HideContentPanel' );
		}

	};

	var _ReadyForDisplay = function()
	{
		return;
	};

	var _OnHideMainMenu = function()
	{
		$( '#MapSelectionList' ).FindChildrenWithClassTraverse( "map-selection-btn__carousel" ).forEach( function( entry )
		{
			entry.SetAutoScrollEnabled( false );
		} );
	};

	var _OnShowMainMenu = function()
	{
		$( '#MapSelectionList' ).FindChildrenWithClassTraverse( "map-selection-btn__carousel" ).forEach( function( entry )
		{
			entry.SetAutoScrollEnabled( true );
		} );
	};

	var _GetPlayType = function ()
	{
		var elDropDownEntry = $( '#PlayTopNavDropdown' ).GetSelected();
		var playType = elDropDownEntry.GetAttributeString( 'data-type', '(not_found)' );
		return playType;
	}	

	var _PlayTopNavDropdownChanged = function()
	{
		var playType = _GetPlayType();

		if ( playType === 'official' || playType === 'listen' )
		{
			m_serverSetting = playType;
			_UpdateBotDifficultyButton();
			_UpdateMapGroupButtons( false );
			_ApplySessionServerSetting();
			return;
		}
		else if ( playType === 'training' )
		{
			UiToolkitAPI.ShowGenericPopupTwoOptionsBgStyle( 'Training',
				'#play_training_confirm',
				'',
				'#OK',
				function()
				{
					LobbyAPI.LaunchTrainingMap();
				},
				'#Cancel_Button',
				function()
				{
				},
				'dim'
			);
		}
		else if ( playType === 'community' )
		{
			if ( '0' === InventoryAPI.GetUIPreferenceString( 'player_nevershow_communityservermessage' ) )
			{
				UiToolkitAPI.ShowCustomLayoutPopup( '', 'file://{resources}/layout/popups/popup_serverbrowser.xml' );
			}
			else
			{
				GameInterfaceAPI.ConsoleCommand( "gamemenucommand openserverbrowser");
			}
		}

		                                                   
		$( '#PlayTopNavDropdown' ).SetSelected( 'Play-' + m_serverSetting );
	};

	var _UpdateBotDifficultyButton = function()
	{
		var playType = _GetPlayType();

		var elDropDown = $( '#BotDifficultyDropdown' );

		var bShowBotDifficultyButton = playType === 'listen';
		elDropDown.SetHasClass( "hidden", !bShowBotDifficultyButton );

		                         
		elDropDown.SetSelected( '3' );
	}

	var _BotDifficultyChanged = function()
	{
		var elDropDownEntry = $( '#BotDifficultyDropdown' ).GetSelected();
		GameTypesAPI.SetCustomBotDifficulty( Number( elDropDownEntry.id ) );
	}	

	return {
		Init: _Init,
		SessionSettingsUpdate		: _SessionSettingsUpdate,
		ReadyForDisplay				: _ReadyForDisplay,
		OnHideMainMenu				: _OnHideMainMenu,
		OnShowMainMenu				: _OnShowMainMenu,
		PlayTopNavDropdownChanged	: _PlayTopNavDropdownChanged,
		BotDifficultyChanged		: _BotDifficultyChanged
	};

} )();

                                                                                                    
                                           
                                                                                                    
( function()
{
	PlayMenu.Init();
	$.GetContextPanel().RegisterForReadyEvents( true );
	$.RegisterEventHandler( "ReadyForDisplay", $.GetContextPanel(), PlayMenu.ReadyForDisplay );
	$.RegisterForUnhandledEvent( "PanoramaComponent_Lobby_MatchmakingSessionUpdate", PlayMenu.SessionSettingsUpdate );
	$.RegisterForUnhandledEvent( "CSGOHideMainMenu", PlayMenu.OnHideMainMenu );
	$.RegisterForUnhandledEvent( "CSGOHidePauseMenu", PlayMenu.OnHideMainMenu );
	$.RegisterForUnhandledEvent( "CSGOShowMainMenu", PlayMenu.OnShowMainMenu );
	$.RegisterForUnhandledEvent( "CSGOShowPauseMenu", PlayMenu.OnShowMainMenu );
} )();
