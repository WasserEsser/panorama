
                                       
'use strict';

var PickemCommon = ( function()
{
	var _Init = function( elPanel )
	{
		elPanel._oPickemData.timerhandle = null;
		_IsDataLoaded( elPanel );
	};

	var _RefreshData = function( elPanel )
	{
		_IsDataLoaded( elPanel );
	};

	var _IsDataLoaded = function( elPanel )
	{
		var listState = MatchListAPI.GetState( elPanel._oPickemData.oInitData.tournamentid  );
		var elLoadingStatus = elPanel.FindChildInLayoutFile( 'id-pickem-loading-status' );
		var elPickemContent = elPanel.FindChildInLayoutFile( 'id-pickem-content' );
		_DefaultActionBarBtnsState(elPanel);

		elLoadingStatus.visible = true;
		elPickemContent.visible = false;

		                                 

		if ( listState === 'none' )
        {
			MatchListAPI.Refresh( elPanel._oPickemData.oInitData.tournamentid  );
			
			_CancelMatchStatsLoadedTimeout( elPanel );
			elPanel._oPickemData.timerhandle = $.Schedule( 5, _MatchStatsLoadedTimeout.bind( undefined, elPanel ) );

			_UpdateLoadingStatusMessage( elPanel, $.Localize( '#CSGO_Watch_Loading_PickEm' ), true );
			return false;
		}
		else if ( listState === 'ready' )
		{
			var isLoaded = PredictionsAPI.GetMyPredictionsLoaded( elPanel._oPickemData.oInitData.tournamentid );
			var sectionsCount = PredictionsAPI.GetEventSectionsCount( elPanel._oPickemData.oInitData.tournamentid );

			                                              
			                                                  
		
			if ( !isLoaded || !sectionsCount || elPanel._oPickemData.oInitData.sectionindex === -1 )
			{
				_CancelMatchStatsLoadedTimeout( elPanel );
				elPanel._oPickemData.timerhandle = $.Schedule( 5, _MatchStatsLoadedTimeout.bind( undefined, elPanel ) );
				
				return false;
			}

			_CancelMatchStatsLoadedTimeout( elPanel );

			elPanel._oPickemData.oTournamentData = _MakeTournamentDataObject( elPanel._oPickemData.oInitData.tournamentid );

			                                                                   
			                                                                        
			elPanel._oPickemData.oInitData.oPickemType.Init( elPanel );
			PickEmInfoBar.Init( elPanel );
			elLoadingStatus.visible = false;
			elPickemContent.visible = true;
			return true;
		}
	};

	var _MakeTournamentDataObject = function( tournamentid )
    {
        var tournamentId = tournamentid;

        var aSections = [];
        var sectionsCount = PredictionsAPI.GetEventSectionsCount( tournamentId );
        for ( var i = 0; i < sectionsCount; i++ )
        {
            aSections.push( _GetSectionData( tournamentId, i ) );
        }

        return {
            tournamentid: tournamentId,
            sections: aSections
        };
    }

    var _GetSectionData = function( tournamentId, dayIndex )
    {
        var sectionId = PredictionsAPI.GetEventSectionIDByIndex( tournamentId, dayIndex );

        var aGroups = [];
        var groupsCount = PredictionsAPI.GetSectionGroupsCount( tournamentId, sectionId );
        for ( var i = 0; i < groupsCount; i++ )
        {
            aGroups.push( _GetGroupData( tournamentId, sectionId, i ) );
        }

        return {
            dayindex: dayIndex,
            sectionid: sectionId,
            isactive: PredictionsAPI.GetSectionIsActive( tournamentId, sectionId ),
            name: PredictionsAPI.GetSectionName( tournamentId, sectionId ),
            desc: PredictionsAPI.GetSectionDesc( tournamentId, sectionId ),
            groups: aGroups
        };
    };

    var _GetGroupData = function( tournamentId, sectionId, idx )
    {
        var groupId = PredictionsAPI.GetSectionGroupIDByIndex( tournamentId, sectionId, idx );

        var aPicks = [];
        var picksCount = PredictionsAPI.GetGroupPicksCount( tournamentId, groupId );
        for ( var i = 0; i < picksCount; i++ )
        {
            var userPickTeamID = PredictionsAPI.GetMyPredictionTeamID( tournamentId, groupId, i );

                                                                                                 
                                                        
            userPickTeamID = userPickTeamID === undefined ? 0 : userPickTeamID;
            aPicks.push( {
                savedid: userPickTeamID,
                localid: userPickTeamID,
                storedefindex: undefined,
            } );
		}

        return {
			id: groupId,
			pickscount: picksCount,
			teamscount:  PredictionsAPI.GetGroupTeamsCount( tournamentId, groupId),
            canpick: PredictionsAPI.GetGroupCanPick( tournamentId, groupId ),
            pickworth: PredictionsAPI.GetGroupPickWorth( tournamentId, groupId ),
            name: PredictionsAPI.GetGroupName( tournamentId, groupId ),
            desc: PredictionsAPI.GetGroupDesc( tournamentId, groupId ),
            picks: aPicks
        };
    };

	var _MatchStatsLoadedTimeout = function( elPanel )
	{
		elPanel._oPickemData.timerhandle = null;
		_UpdateLoadingStatusMessage( elPanel, $.Localize( '#pickem_apply_timeout' ), false );
	};

	var _CancelMatchStatsLoadedTimeout = function( elPanel )
	{
		if ( elPanel._oPickemData.timerhandle )
		{
			$.CancelScheduled( elPanel._oPickemData.timerhandle );
			elPanel._oPickemData.timerhandle = null;
		}
	};

	var _UpdateLoadingStatusMessage = function( elPanel, messageText, showSpinner )
	{
		var elLoadingStatus = elPanel.FindChildInLayoutFile( 'id-pickem-loading-status' );
		elLoadingStatus.FindChildInLayoutFile( 'Message' ).text = messageText;

		var elLoadingStatus = elPanel.FindChildInLayoutFile( 'id-pickem-loading-status' );
		elLoadingStatus.FindChildInLayoutFile( 'Spinner' ).visible = showSpinner;
	};

	var _ReadyForDisplay = function( elPanel )
	{
		elPanel._oPickemData.eventhandle = $.RegisterForUnhandledEvent(
			'PanoramaComponent_MatchList_StateChange',
			_RefreshData.bind( undefined, elPanel )
		);
		
		                                                                   
		                                                                        
		elPanel._oPickemData.eventhandleprediction = $.RegisterForUnhandledEvent( 
			'PanoramaComponent_MatchList_PredictionUploaded', 
			elPanel._oPickemData.oInitData.oPickemType.UpdatePrediction.bind( undefined, elPanel )
		);

		elPanel._oPickemData.eventhandleinventoryUpdate = $.RegisterForUnhandledEvent( 
			'PanoramaComponent_Store_PurchaseCompleted', 
			elPanel._oPickemData.oInitData.oPickemType.PurchaseComplete.bind( undefined, elPanel )
		);


		if( PredictionsAPI.GetMyPredictionsLoaded( elPanel._oPickemData.oInitData.tournamentid ) )
		{
			elPanel._oPickemData.oInitData.oPickemType.UpdatePrediction( elPanel );
		}
	};

	var _UnreadyForDisplay = function( elPanel )
	{
		$.UnregisterForUnhandledEvent('PanoramaComponent_MatchList_StateChange', elPanel._oPickemData.eventhandle );
		$.UnregisterForUnhandledEvent('PanoramaComponent_MatchList_PredictionUploaded', elPanel._oPickemData.eventhandleprediction );
		$.UnregisterForUnhandledEvent('PanoramaComponent_Store_PurchaseCompleted', elPanel._oPickemData.eventhandleinventoryUpdate );
	};

	                         

	var _UpdateImageForPick = function( oItemIdData, elItemImage, localTeamId )
	{
		var bValidTeamID = localTeamId ? ( oItemIdData.itemid ? true : false ) : false;

		if ( bValidTeamID )
		{
			elItemImage.itemid = oItemIdData.itemid;
		}

		elItemImage.SetHasClass( 'hidden', !bValidTeamID );
	};

	var _UpdateCorrectPickState = function ( oGroupData, correctPicks, localTeamId, elPointsEarned, showOnlyNumbers )
	{
		if ( correctPicks )
		{
			var isCorrect = _CheckIfPickIsCorrect( correctPicks, localTeamId );
			elPointsEarned.SetHasClass( 'hidden', !isCorrect );

			if ( isCorrect )
			{
				if( showOnlyNumbers )
				{
					elPointsEarned.text = '+ ' + oGroupData.pickworth;
					return;
				}
				
				var pluralString = oGroupData.pickworth === 1 ? $.Localize( '#pickem_point' ) : $.Localize( '#pickem_points' );
				elPointsEarned.SetDialogVariableInt( 'points', oGroupData.pickworth );
				elPointsEarned.SetDialogVariable( 'plural', pluralString );
			}
		}
	};

	var _ShowPickItemNotOwnedWarning = function( isSectionActive, oGroupData, oItemIdData, elItemNotOwned, localTeamId )
	{
		if ( isSectionActive && oGroupData.canpick && localTeamId )
		{
			if( oItemIdData.type === 'fakeitem' )
			{
				elItemNotOwned.RemoveClass( 'hidden' );
				return true;
			}
		}

		elItemNotOwned.AddClass( 'hidden' );
		return false;
	};

	var _SetPointsWorth = function( elLabel, points )
	{
		var pluralString = points === 1 ? $.Localize( '#pickem_point' ) : $.Localize( '#pickem_points' );
		elLabel.SetDialogVariableInt( 'points', points );
		elLabel.SetDialogVariable( 'plural', pluralString );
	};

	var _SetTeamImage = function ( tournamentId, elLogoImage, elTeam, useFakeItemId = '' )
	{
		var szImageToUse = null;
		var yourItemId = PredictionsAPI.GetMyPredictionItemIDForTeamID( tournamentId, elTeam._oteamData.teamid );

		if (( !yourItemId || yourItemId === '0' || yourItemId === 0 ) && !useFakeItemId )
		{
			szImageToUse = _GetTeamImage( elTeam );
			elLogoImage.AddClass( 'barelogo' );
		}
		else
		{
			yourItemId = ( useFakeItemId !== '' ) ? useFakeItemId : yourItemId;

			szImageToUse = 'file://{images_econ}/'+InventoryAPI.GetItemInventoryImage( yourItemId )+'.png';
			elLogoImage.RemoveClass( 'barelogo' );
		}
		elLogoImage.SetImage( szImageToUse );
	};

	var _GetTeamImage = function( elTeam )
	{
		var teamTag = PredictionsAPI.GetTeamTag( elTeam._oteamData.teamid );
		return 'file://{images}/tournaments/teams/' + teamTag + '.svg';
	};
	

	var _GetTeamItemDefIndex = function( teamId )
	{
		var team = g_ActiveTournamentTeams.filter( team => team.teamid === teamId );
		return team[0].itemid_sticker;
	};

	var _ShowHideRemoveBtn = function ( isSectionActive, canPick, localTeamId, elRemoveButton )
	{
		var showRemoveBtn = ( isSectionActive && canPick && localTeamId ) ? true : false;
		elRemoveButton.SetHasClass( 'hidden', !showRemoveBtn );

		return showRemoveBtn;
	};

	var _UpdateRemoveBtn = function ( elPanel, oGroupData, localTeamId, elRemoveButton, funcCallback )
	{
		elRemoveButton.SetPanelEvent( 'onactivate', _RemovePick.bind( undefined, elPanel, oGroupData, localTeamId, funcCallback ) );
	};

	var _RemovePick = function ( elPanel, oGroupData, localTeamId, funcCallback )
	{
		$.DispatchEvent( 'PlaySoundEffect', 'sticker_applySticker', 'MOUSE' );

		                                   
		                                           

		for ( var i = 0; i < oGroupData.picks.length; i++ )
		{
			if ( oGroupData.picks[i].localid === localTeamId )
			{
				oGroupData.picks[i].localid = 0;
			}
		}

		funcCallback( elPanel );
	};

	var _CheckIfPickIsCorrect = function( correctPicks, userPickTeamID )
	{
		var aCorrectPicks = correctPicks.split( ',' );
		var correctPicksCount = aCorrectPicks.length;

		for ( var i = 0; i < correctPicksCount; i++ )
		{
			if ( aCorrectPicks[ i ] === userPickTeamID.toString() )
			{
				return true;
			}
		}

		return false;
	};

	var _IsPickSaved = function( oPick )
	{	
		if( ( oPick.localid === oPick.savedid ) && oPick.localid !== 0 && oPick.localid !== undefined )
		{
			return true;
		}

		return false;
	};

	var _GetYourPicksItemIdData = function( tournamentId, userPickTeamID )
	{
		var yourItemId = PredictionsAPI.GetMyPredictionItemIDForTeamID( tournamentId, userPickTeamID );

		                                                                                             
		if ( !yourItemId || yourItemId === '0' || yourItemId === 0 )
		{
			yourItemId = PredictionsAPI.GetFakeItemIDToRepresentTeamID( tournamentId, userPickTeamID );
			return { type:'fakeitem', itemid:yourItemId };
		}
		
		return { type:'owneditem', itemid:yourItemId };
	};

	var _GetTournamentIdNumFromString = function( tournament_id )
	{
		return Number( tournament_id.split( ':' )[ 1 ] );
	};

	var _CheckIfTeamIsAlreadyPicked = function ( oGroupData, teamIdToCompare )
	{		
		for ( var i = 0; i < oGroupData.pickscount; i++)
		{	
			if ( oGroupData.picks[i].localid === teamIdToCompare )
			{
				return true;
			}
		}
	
		return false;
	};
	
	var _DefaultActionBarBtnsState = function(elPanel)
	{
		var elPurchase = elPanel.FindChildInLayoutFile( 'id-pickem-getitems' );
		var elApply = elPanel.FindChildInLayoutFile( 'id-pickem-apply' );
		elPurchase.visible = false;
		elApply.visible = false;
	};

	var _UpdateActionBarBtns = function( elPanel, _funcListOfPicksWithNoOwnedItems, _funcMakePicksParams, _funcEnableApply )
	{
		var elPurchase = elPanel.FindChildInLayoutFile( 'id-pickem-getitems' );
		var listStoreIndex = _funcListOfPicksWithNoOwnedItems( elPanel );
		var bShow = listStoreIndex.length > 0;
		if( elPurchase.visible !== bShow )
			elPurchase.TriggerClass( 'popup-capability-update-anim' );

		elPurchase.visible = bShow;
		_MouseOverEventsWithStickersToPurchase( elPurchase, 'id-pickem-getitems', listStoreIndex );
		_EventsForPurchaseBtn( elPurchase, listStoreIndex );

		var elApplyPicks = elPanel.FindChildInLayoutFile( 'id-pickem-apply' );
		var bEnable = _funcEnableApply( elPanel );
		elApplyPicks.visible = true;
		elApplyPicks.SetHasClass( 'loop', bEnable );
		
		if( elApplyPicks.enabled !== bEnable )
			elApplyPicks.TriggerClass( 'popup-capability-update-anim' );

		                                                                                               
		                                    

		elApplyPicks.enabled = bEnable;
		_EventsForApplyBtn( elPanel, elApplyPicks, _funcListOfPicksWithNoOwnedItems, _funcMakePicksParams );
		_MouseOverEventsWithStickersToPurchase( elApplyPicks, 'id-pickem-apply', listStoreIndex );
	};

	var _MouseOverEventsWithStickersToPurchase = function( elButton, btnid, listStoreIndex )
	{
		var _OnMouseOver = function( listStoreIndex )
		{
			var num = 0;
			var names = $.Localize( '#pickem_get_items_tooltip' );
			listStoreIndex.forEach( element =>
			{
				var itemId = InventoryAPI.GetFauxItemIDFromDefAndPaintIndex( element.storedefindex, 0 );
				names = names + InventoryAPI.GetItemName( itemId ) + '<br>';
				++num;
			} );

			if ( num > 0 )
			{
				UiToolkitAPI.ShowTextTooltip( btnid, names );
			}
		};
	
		elButton.SetPanelEvent( 'onmouseover', _OnMouseOver.bind( undefined, listStoreIndex ) );
		elButton.SetPanelEvent( 'onmouseout', function() { UiToolkitAPI.HideTextTooltip(); } );
	};

	var _EventsForPurchaseBtn = function( elPurchase, listStoreIndex )
	{
		var _OnActivatePurchase = function( listStoreIndex )
		{
			var aList = [];
			listStoreIndex.forEach( element =>
			{
				aList.push( element.storedefindex );
			} );

			var purchaseString = aList.join( ',' );
			StoreAPI.StoreItemPurchase( purchaseString );
		};

		elPurchase.SetPanelEvent( 'onactivate', _OnActivatePurchase.bind( undefined, listStoreIndex ) );
	};

	var _EventsForApplyBtn = function( elPanel, elApplyBtn, _funcListOfPicksWithNoOwnedItems, _funcMakePicksParams )
	{
		var _OnApplyPicks = function( elPanel, elApplyBtn)
		{
			var popup = UiToolkitAPI.ShowCustomLayoutPopupParameters( 
				'', 
				'file://{resources}/layout/popups/popup_confirm_picks.xml',
				'none'
			);

			var list = _funcListOfPicksWithNoOwnedItems( elPanel );
			var alistTeams = [];
			list.forEach(element => {
				alistTeams.push( element.localid );
			});

			                                       
			var oData = _funcMakePicksParams( elPanel );

			if ( typeof popup._oPicksData !== 'object' )
			{
				popup._oPicksData = {};
			}

			popup._oPicksData.args = oData.args;
			popup._oPicksData.picksforconfirm = oData.idsForDisplayInConfimPopup;
			popup._oPicksData.picksnoitems = alistTeams;
		};

		elApplyBtn.SetPanelEvent( 'onactivate', _OnApplyPicks.bind( undefined,elPanel, elApplyBtn ) );
	};
	
	return {
		Init: _Init,
		ReadyForDisplay: _ReadyForDisplay,
		RefreshData: _RefreshData,
		UnreadyForDisplay: _UnreadyForDisplay,
		GetTournamentIdNumFromString: _GetTournamentIdNumFromString,
		CheckIfTeamIsAlreadyPicked: _CheckIfTeamIsAlreadyPicked,
		UpdateImageForPick: _UpdateImageForPick,
		UpdateCorrectPickState : _UpdateCorrectPickState,
		ShowPickItemNotOwnedWarning: _ShowPickItemNotOwnedWarning,
		SetTeamImage: _SetTeamImage,
		GetTeamImage: _GetTeamImage,
		SetPointsWorth: _SetPointsWorth,
		IsPickSaved: _IsPickSaved,
		ShowHideRemoveBtn: _ShowHideRemoveBtn,
		UpdateRemoveBtn: _UpdateRemoveBtn,
		UpdateActionBarBtns: _UpdateActionBarBtns,
		GetTeamItemDefIndex : _GetTeamItemDefIndex,
		GetYourPicksItemIdData : _GetYourPicksItemIdData
	};

} )();

( function()
{
	                                                                                                   
} )(); 